let payload_size = 250000;
const iteration_count = 110;

let api_url = "https://api.pixelgladiator.com";
let download_request_url = api_url + "/speedtest_download";
let upload_request_url = api_url + "/speedtest_upload";
const begin_button = document.getElementById( "test_begin_button" );
const log_button = document.getElementById( "test_log_button" );
const log_area = document.getElementById( "log_area" );
const log = document.getElementById( "test_log" );
const download_speed = "download_speed";
const download_speed_max = "download_speed_max";
const download_speed_min = "download_speed_min";
const download_status = "download_status";
const upload_speed = "upload_speed";
const upload_speed_max = "upload_speed_max";
const upload_speed_min = "upload_speed_min";
const upload_status = "upload_status";
const test_status = "test_status";
const e_download_speed = document.getElementById( download_speed );
const e_download_speed_max = document.getElementById( download_speed_max );
const e_download_speed_min = document.getElementById( download_speed_min );
const e_download_status = document.getElementById( download_status );
const e_upload_speed = document.getElementById( upload_speed );
const e_upload_speed_max = document.getElementById( upload_speed_max );
const e_upload_speed_min = document.getElementById( upload_speed_min );
const e_upload_status = document.getElementById( upload_status );
const result_status = document.getElementById( test_status );
const DEBUG_MODE = true;

begin_button.addEventListener( "click", ( event ) => {
	start_test( iteration_count );
} );

log_button.addEventListener( "click", toggle_log );

window.addEventListener( "load", ( event ) => {
	warm_up( 10 );
} );


let timeout = 1000;

function toggle_log( ) {
	if( log_area.style.display === "block" ) {
		log_area.style.display = "none";
	} else {
		log_area.style.display = "block";
		log.scrollTop = log.scrollHeight;
	}
}

// Make sure out lambda functions are warmed up
// so it doesn't pull down the average
async function warm_up( iterations ) {
	let testdata = await download_test( iterations, false );
	if( testdata !== null ) {
		await upload_test( testdata, iterations, false );
	}
}

async function start_test( iterations ) {

	log.textContent = "";
	
	e_download_speed.textContent = 0;
	e_download_speed_max.textContent = 0;
	e_download_speed_min.textContent = 0;
	e_download_status.textContent = "0%";
	
	e_upload_speed.textContent = 0;
	e_upload_speed_max.textContent = 0;
	e_upload_speed_min.textContent = 0;
	e_upload_status.textContent = "0%";
	
	let testdata = await download_test( iterations, true );
	if( testdata !== null ) {
		await upload_test( testdata, iterations, true );
	}
	
	result_status.textContent = "Testing Complete";
}

async function fetch_iterations( iteration_type, request_url, request_body ) {
	let return_data = { };
	let time_start = 0;
	let time_end = 0;
	
	//console.log( JSON.stringify( request_body ) );
	
	let post_request = {
		'method': 'POST',
		'headers': {
			'Content-Type': 'application/json',
		},
		'body': JSON.stringify( request_body ),
	};
	if( iteration_type == 'Upload' ) {
		time_start = performance.now( );
	}
	// Make the request
	const response = await fetch( request_url, post_request );
	if( iteration_type == 'Download' ) {
		time_start = performance.now( );
	} else {
		time_end = performance.now( );
	}
	// Get the response
	const data = await response.json( );
	if( iteration_type == 'Download' ) {
		time_end = performance.now( );
	}
	
	if( ! data.body ) {
		console.error( "Missing response body : " + JSON.stringify( data ) );
	} else {
		if( ! data.body.data ) {
			console.error( "Missing data : " + JSON.stringify( data.body.message ) );
		} else {
			return_data[ 'data' ] = data.body.data;
			return_data[ 'package_size' ] = return_data[ 'data' ].length;
		}
	}

	if( 'data' in return_data && 'package_size' in return_data ) {
		// Adjusted time from msecs to secs
		let time_elapsed = ( time_end - time_start ) / 1000;
		
		if( return_data[ 'package_size' ] != payload_size ) {
			console.error( iteration_type + " data is " + return_data[ 'package_size' ] + " characters, expecting " + payload_size );
		} else {
			// Data in bits
			let received_length = return_data[ 'package_size' ] * 8;
			// bits per second
			return_data[ 'speed' ] = ( received_length / time_elapsed ) / 1000000;
			if( DEBUG_MODE ) {
				console.log( "Speed Calculation : " + received_length + " / " + time_elapsed + " / " + 1000000 + " = " + return_data[ 'speed' ] );
			}
		}
	}
	
	return return_data;
}

async function process_data( iteration_type,
							 iteration,
							 iterations,
							 speed_data,
							 e_speed,
							 e_speed_max,
							 e_speed_min,
							 e_status,
							 do_logging ) {
	let total_speed = 0;
	let average_speed = 0;
	let skipped = 10;
	
	let max_sample = iterations - skipped;
	if( iteration < max_sample ) {
		max_sample = iteration - skipped;
	}
	
	if( max_sample > 0 ) {
		if( speed_data[ 'rate_min' ] == 0 ) {
			speed_data[ 'rate_min' ] = speed_data[ 'speed' ];
		}
		
		speed_data[ 'speeds' ].push( speed_data[ 'speed' ] );
		if( speed_data[ 'speed' ] > speed_data[ 'rate_max' ] ) {
			speed_data[ 'rate_max' ] = speed_data[ 'speed' ];
		} else if ( speed_data[ 'speed' ] < speed_data[ 'rate_min' ] ) {
			speed_data[ 'rate_min' ] = speed_data[ 'speed' ];
		}
		
		for( let index = 0; index < speed_data[ 'speeds' ].length; index++ ) {
			total_speed += speed_data[ 'speeds' ][ index ];
		}
		average_speed = total_speed / max_sample;
		
		if( do_logging ) {
			log.textContent = log.textContent + "\n" + ( iteration - skipped ) + ") " + speed_data[ 'speed' ].toFixed( 2 ) + " Mbps " + iteration_type + " Average : " + average_speed.toFixed( 2 ) + " Mbps";
			log.scrollTop = log.scrollHeight;
			e_speed.textContent = average_speed.toFixed( 2 ) + " Mbps";
			e_speed_max.textContent = speed_data[ 'rate_max' ].toFixed( 2 ) + " Mbps";
			e_speed_min.textContent = speed_data[ 'rate_min' ].toFixed( 2 ) + " Mbps";
			
			e_status.textContent = ( ( ( iteration - skipped ) / ( iterations - skipped ) ) * 100 ).toFixed( 1 ) + "%";
		}
	}
	
	return speed_data;
}

async function download_test( iterations, do_logging ) {
	if( do_logging ) {
		result_status.textContent = 'Running Download test';
	}
	let iteration_type = 'Download';
	let speed_data = {
		'speeds' : [ ],
		'rate_min' : 0,
		'rate_max' : 0,
		'speed' : 0
	};
	let return_data = { };
	let return_data_block = null;
	
	const request_body = {
		'size' : payload_size,
	};
	
	for( let iteration = 1; iteration <= iterations; iteration++ ) {
		let package_size = 0;
		return_data = await fetch_iterations( iteration_type, download_request_url, request_body );
		
		if( 'data' in return_data === false ) {
			console.error( 'Request did not return data.' );
		} else {
			if( return_data_block === null ) {
				return_data_block = return_data[ 'data' ];
			}
			speed_data[ 'speed' ] = return_data[ 'speed' ];
			speed_data = await process_data( iteration_type,
											 iteration,
											 iterations,
											 speed_data,
											 e_download_speed,
											 e_download_speed_max,
											 e_download_speed_min,
											 e_download_status,
											 do_logging );
		}
	}
	return return_data_block;
}

async function upload_test( data, iterations, do_logging ) {
	if( do_logging ) {
		result_status.textContent = 'Running Upload test';
	}

	let iteration_type = 'Upload';
	let speed_data = {
		'speeds' : [ ],
		'rate_min' : 0,
		'rate_max' : 0,
		'speed' : 0
	};
	let skipped = 10;
	
	if( parseInt( data.length ) != payload_size ) {
		console.error( "Upload : data is " + data.length + " characters, expecting " + payload_size );
	}
	
	const request_body = {
		'size' : payload_size,
		'data' : data
	};
	
	for( let iteration = 1; iteration <= iterations; iteration++ ) {
		let return_data = await fetch_iterations( iteration_type, upload_request_url, request_body );

		if( 'speed' in return_data === false ) {
			console.error( 'Request did not return data.' );
		} else {
			speed_data[ 'speed' ] = return_data[ 'speed' ];
			speed_data = await process_data( iteration_type,
											 iteration,
											 iterations,
											 speed_data,
											 e_upload_speed,
											 e_upload_speed_max,
											 e_upload_speed_min,
											 e_upload_status,
											 do_logging );
		}
    }
}


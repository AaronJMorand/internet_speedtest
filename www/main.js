let payload_size = 250000;
const iterations = 100;

let api_url = "https://api.pixelgladiator.com";
let download_request = api_url + "/speedtest_download";
let upload_request = api_url + "/speedtest_upload";
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

begin_button.addEventListener( "click", start_test );

log_button.addEventListener( "click", toggle_log );

let timeout = 1000;

function toggle_log( ) {
	if( log_area.style.display === "block" ) {
		log_area.style.display = "none";
	} else {
		log_area.style.display = "block";
		log.scrollTop = log.scrollHeight;
	}
}

async function start_test( ) {

	log.textContent = "";
	
	e_download_speed.textContent = 0;
	e_download_speed_max.textContent = 0;
	e_download_speed_min.textContent = 0;
	e_download_status.textContent = "0%";
	
	e_upload_speed.textContent = 0;
	e_upload_speed_max.textContent = 0;
	e_upload_speed_min.textContent = 0;
	e_upload_status.textContent = "0%";
	
	let testdata = await download_test( );
	
	await upload_test( testdata );
	
	result_status.textContent = "Testing Complete";
}

async function download_test( ) {
	let speeds = [ ];
	let total_speed = 0;
	let average_speed = 0;
	let rate_max = 0;
	let rate_min = 0;
	let skip_slow = true;
	let skip_count = 0;
	let skipped = 0;
	
	let return_data = { };
	
	const request_body = {
		"size" : payload_size,
	};
	
	const post_request = {
		'method': 'POST',
		'headers': {
			'Content-Type': 'application/json',
		},
		'body': JSON.stringify( request_body ),
	};

	for( let iteration = 1; iteration <= iterations; iteration++ ) {
		let package_size = 0;
		result_status.textContent = "Running Download test";
		return_data = { };
		
		const response = await fetch( download_request, post_request );
		let time_start = performance.now( );
		
		const data = await response.json( );
		let time_end = performance.now( );
		if( ! data.body ) {
			console.error( "Missing response body : " + JSON.stringify( data ) );
			break;
		} else {
			if( ! data.body.data ) {
				console.error( "Missing data : " + JSON.stringify( data.body ) );
				break;
			} else {
				return_data = data.body.data;
				package_size = return_data.length;
			}
		}
		
		// Adjusted time from msecs to secs
		let time_elapsed = ( time_end - time_start ) / 1000;
		
		if( parseInt( package_size ) != payload_size ) {
			console.log( "Download : data is " + package_size + " characters, expecting " + payload_size );
		}
		
		// Data in bits
		let received_length = package_size * 8;
		// bits per second
		let speed = ( received_length / time_elapsed ) / 1000000;
		speeds.push( speed );
		
		if( rate_min == 0 ) {
			rate_min = speed;
		}
		
		total_speed = 0;
		let max_sample = iterations - skipped;
		if( iteration < max_sample ) {
			max_sample = iteration - skipped;
		}
		
		if( max_sample > 0 ) {
			if( speed > rate_max ) {
				rate_max = speed;
			} else if ( speed < rate_min ) {
				rate_min = speed;
			}

			for( let index = 4; index < max_sample; index++ ) {
				total_speed += speeds[ index ];
			}
			average_speed = total_speed / max_sample;
		}

		log.textContent = log.textContent + "\n" + iteration + ") " + speed.toFixed( 2 ) + " Mbps Download Average : " + average_speed.toFixed( 2 ) + " Mbps";
		log.scrollTop = log.scrollHeight;
		e_download_speed.textContent = average_speed.toFixed( 2 ) + " Mbps";
		e_download_speed_max.textContent = rate_max.toFixed( 2 ) + " Mbps";
		e_download_speed_min.textContent = rate_min.toFixed( 2 ) + " Mbps";
		
		e_download_status.textContent = ( ( ( iteration - skipped ) / ( iterations - skipped ) ) * 100 ).toFixed( 1 ) + "%";
	}
	return return_data;
}

async function upload_test( data ) {
	result_status.textContent = "Running Upload test";

	let speeds = [ ];
	let total_speed = 0;
	let average_speed = 0;
	let rate_max = 0;
	let rate_min = 0;
	let message = undefined;
	let skip_slow = false;
	let skip_count = 0;
	let skipped = 0;
	
	if( parseInt( data.length ) != payload_size ) {
		console.log( "Upload : data is " + data.length + " characters, expecting " + payload_size );
	}
	
	let request_body = {
		"size" : payload_size,
		"data" : data
	};

	let post_request = {
		'method': 'POST',
		'headers': {
			'Content-Type': 'application/json',
		},
		'body': JSON.stringify( request_body ),
	};
	
	for( let iteration = 1; iteration <= iterations; iteration++ ) {
		
		let time_start = performance.now( );
		let response = await fetch( upload_request, post_request );
		let time_end = performance.now( );
		
		let return_data = await response.json( );
		
		// Adjusted time from msecs to secs
		let time_elapsed = ( time_end - time_start ) / 1000;
		
		// Data in bits
		let received_length = data.length * 8;
		// Mbits per second
		let speed = ( received_length / time_elapsed ) / 1000000;
		speeds.push( speed );

		if( rate_min == 0 ) {
			rate_min = speed;
		}
		
		total_speed = 0;
		let max_sample = iterations - skipped;
		if( iteration < max_sample ) {
			max_sample = iteration - skipped;
		}

		if( max_sample > 0 ) {
			if( speed > rate_max ) {
				rate_max = speed;
			} else if ( speed < rate_min ) {
				rate_min = speed;
			}
		
			for( let index = 4; index < max_sample; index++ ) {
				total_speed += speeds[ index ];
			}
			average_speed = total_speed / max_sample;
		}
		
		log.textContent = log.textContent + "\n" + iteration + ") " + speed.toFixed( 2 ) + " Mbps Upload Average : " + average_speed.toFixed( 2 ) + " Mbps";
		log.scrollTop = log.scrollHeight;
		e_upload_speed.textContent = average_speed.toFixed( 2 ) + " Mbps";
		e_upload_speed_max.textContent = rate_max.toFixed( 2 ) + " Mbps";
		e_upload_speed_min.textContent = rate_min.toFixed( 2 ) + " Mbps";
		
		e_upload_status.textContent = ( ( ( iteration - skipped ) / ( iterations - skipped ) ) * 100 ).toFixed( 1 ) + "%";
    }
}


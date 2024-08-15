
export const handler = async ( event, context ) => {
  let test_size = process.env.size_default;
  
  let response = {
    statusCode: 400,
    body: {
      "message" : "Data is Missing while expecting " + test_size,
    }
  };
  
  if( event.body ) {
    const body_info = JSON.parse( event.body );
    
    if( body_info.size ) {
      if( parseInt( body_info.size ) < parseInt( process.env.size_min ) ) {
        test_size = process.env.size_min;
        
      } else if( parseInt( body_info.size ) > parseInt( process.env.size_max ) ) {
        test_size = process.env.size_max;

      } else {
        test_size = body_info.size;
      }
    }
    
    if( body_info.data ) {
      if( body_info.data.length == test_size ) {
        response = {
          statusCode: 200,
          body: { "message" : "Test Complete" }
        };
        
      } else {
        console.log( "Event data has length of " + body_info.data.length + " while expecting " + test_size );
        response = {
          statusCode: 400,
          body: { "message" : "Invalid Data Size - got " + body_info.data.length + " while expecting " + test_size }
        };
      }
      
    } else {
      console.log( "No Data in the event." );
    }
    
  } else {
    console.log( "No event body." );
  }
  
  console.log( "Responding with : " + response.statusCode );
  return response;
};

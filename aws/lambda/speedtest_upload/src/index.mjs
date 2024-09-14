
export const handler = async ( event, context ) => {
  let test_size = process.env.size_default;
  
  let response = {
    statusCode: 400,
    body: {
      "message" : "Data is Missing while expecting " + test_size,
    }
  };
  
  if( event ) {
    
    if( event.size ) {
      if( parseInt( event.size ) < parseInt( process.env.size_min ) ) {
        test_size = process.env.size_min;
        
      } else if( parseInt( event.size ) > parseInt( process.env.size_max ) ) {
        test_size = process.env.size_max;

      } else {
        test_size = event.size;
      }
    }
    
    if( event.data ) {
      if( event.data.length == test_size ) {
        response = {
          statusCode: 200,
          body: { "message" : "Test Complete", "data" : event.data }
        };
        
      } else {
        console.log( "Event data has length of " + event.data.length + " while expecting " + test_size );
        response = {
          statusCode: 400,
          body: { "message" : "Invalid Data Size - got " + event.data.length + " while expecting " + test_size }
        };
      }
      
    } else {
      console.log( "No Data in the event." );
    }
    
  } else {
    console.log( "No event." );
  }
  
  console.log( "Responding with : " + response.statusCode );
  return response;
};



const chars =   "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

async function generate_test_data( sizeInBytes ) {
  const iterations = sizeInBytes;
  
  let result = "";
  
  for ( var index = 0; index < iterations; index++ ) {
    result += chars.charAt( Math.floor( Math.random( ) * chars.length ) );
  }
  
  return result;
}

export const handler = async ( event ) => {
  let test_size = process.env.size_default;
  
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
    
  } else {
    console.error( "No event data received!" );
  }
  
  let return_body = {
    "data" : await generate_test_data( test_size ),
  }
  
  const response = {
    "statusCode" : 200,
    "headers" : {
      "Content-Type" : "application/json",
    },
    "body" : return_body,
  };
  return response;
};

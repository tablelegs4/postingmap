exports.handler = async (event) => {
    const params = event.queryStringParameters;
    const place = (params.place || "").toLowerCase();
  
    const validPlaces = [
      "hokkaido", "aomori", "iwate", "tokyo", "osaka", "okinawa" // etc...
    ];
  
    const redirectURL = validPlaces.includes(place)
      ? `/${place}/map/`
      : "/regions/";
  
    return {
      statusCode: 302,
      headers: {
        Location: redirectURL,
      },
    };
  };
  
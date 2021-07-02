// Global variables
var geolocation; // Location based on the user's IP address
var allCurrInfo; // The current JSON data returned by the Ticketmaster API

// Get the geolocation information based on the user's IP address
function getGeolocation() {
  $(".tooltip").tooltip({'trigger':'manual', 'title': 'Name is Required Field'});

  document.querySelector("#search").disabled = true;
  $.get("https://ipinfo.io/json?token=e12792029dfd7b", function(output) {
    geolocation = output.loc.split(",")
    document.querySelector("#search").disabled = false;
  });
}

function clickSearch() {
  // Automatically hides the tooltip alerts when the search button is clicked
  $("#keyword").tooltip("hide");
  $("#location").tooltip("hide");
  document.getElementById("results").innerHTML = "";
  document.getElementById("detailWrapper").innerHTML = "";

  // Checks the respective fields to see if they have values
  if (!document.getElementById("keyword").value) {
    $("#keyword").tooltip("show");
  }
  else if (document.getElementById("locationButton").checked &&
            !document.getElementById("location").value) {
    $("#location").tooltip("show");
  }
  // Processes the input data and sends it to the Python script
  else {
    // Gets all the form data
    var keywordVal = document.getElementById("keyword").value;
    var locLat = geolocation[0]; // Default value of Here button is checked
    var locLng = geolocation[1];
    var categoryVal = document.getElementById("categoryList").value;
    var distVal = document.getElementById("distance").value;
    if (!distVal) {
      distVal = document.getElementById("distance").placeholder;
    }

    // Gets the geolocation of a custom location if applicable
    if (document.getElementById("locationButton").checked == true) {
      var requestURL = "https://maps.googleapis.com/maps/api/geocode/json?address=";
      locAddress = document.getElementById("location").value;
      locAddress = locAddress.replace(/\s+/g,'+');
      requestURL += locAddress + "&key=" + "AIzaSyByRcXBVz9YK4SHlNHCNYe2Sd-pTP21_uo";

      // Make GET request
      $.get(requestURL, function(output) {
        if (output.status == "OK") {
          locLat = output.results[0].geometry.location.lat;
          locLng = output.results[0].geometry.location.lng;
        }
      }).then(function() {
        const xhr = new XMLHttpRequest();
        var data = {"keyword":keywordVal, "category":categoryVal, "distance":distVal, 
                "loc1":locLat, "loc2": locLng};
        var urlRequest = "?keyword=" + keywordVal + "&category=" + categoryVal +
                          "&distance=" + distVal + "&loc1=" + locLat + "&loc2=" + locLng;
        xhr.open("GET", "/ticketmaster" + urlRequest, true);
        xhr.send(data)
        xhr.onreadystatechange = function() {
          if (this.status === 200 && this.readyState === 4) {
            var outputDiv = document.getElementById("results");
            allCurrInfo = JSON.parse(this.responseText);

            if (allCurrInfo["status"]) {
              outputDiv.innerHTML = "<div id='noResults'>No Records have been found</div>";
              document.getElementById("detailWrapper").innerHTML = "";
            }
            else {
              outputTable = "<table><tr><th>Date</th><th>Icon</th><th>Event</th><th>Genre</th><th>Venue</th></tr>";
              for (var i = 0; i < 20; i++) {
                if (!allCurrInfo.hasOwnProperty("" + i)) { break; }

                outputTable += "<tr><td style='text-align: center'>" + allCurrInfo[i].date + 
                                "</td><td><img height=auto width=100 src=" + 
                                allCurrInfo[i].icon + "></img></td><td><a onclick=showMore(" + i + 
                                ")>" + allCurrInfo[i].event + "</a></td><td>" + allCurrInfo[i].genre + 
                                "</td><td>" + allCurrInfo[i].venue + "</td></tr>";
              }
              outputTable += "</table>"
              outputDiv.innerHTML = outputTable;
            }
          }
        }
      })
    }
    else {
      // Do the same request
      const xhr = new XMLHttpRequest();
      var data = {"keyword":keywordVal, "category":categoryVal, "distance":distVal, 
                "loc1":locLat, "loc2": locLng};
      var urlRequest = "?keyword=" + keywordVal + "&category=" + categoryVal +
                          "&distance=" + distVal + "&loc1=" + locLat + "&loc2=" + locLng;
      xhr.open("GET", "/ticketmaster" + urlRequest, true);
      xhr.send(data)
      xhr.onreadystatechange = function() {
        if (this.status === 200 && this.readyState === 4) {
          var outputDiv = document.getElementById("results");
          allCurrInfo = JSON.parse(this.responseText);

          if (allCurrInfo["status"]) {
            outputDiv.innerHTML = "<div id='noResults'>No Records have been found</div>";
            document.getElementById("detailWrapper").innerHTML = "";
          }
          else {
            outputTable = "<table><tr><th>Date</th><th>Icon</th><th>Event</th><th>Genre</th><th>Venue</th></tr>";
            for (var i = 0; i < 20; i++) {
              if (!allCurrInfo.hasOwnProperty("" + i)) { break; }

              outputTable += "<tr><td style='text-align: center'>" + allCurrInfo[i].date + 
                              "</td><td><img height=auto width=100 src=" + 
                              allCurrInfo[i].icon + "></img></td><td><a onclick=showMore(" + i + 
                              ")>" + allCurrInfo[i].event + "</a></td><td>" + allCurrInfo[i].genre + 
                              "</td><td>" + allCurrInfo[i].venue + "</td></tr>";
            }
            outputTable += "</table>"
            outputDiv.innerHTML = outputTable;
          }
        }
      }
    }
  }
}

// Displays more details about the event that has been clicked
function showMore(index) {
  var outputDiv = document.getElementById("detailWrapper");
  var outputHTML = "<h2>" + allCurrInfo[index].event + 
                    "</h2><div style='display: flex; justify-content: space-around;'><div id='details'><h3>Date</h3><p>" +  
                    allCurrInfo[index].date + "</p><h3>Artist / Team</h3><p>";
  for (var i = 0; i < allCurrInfo[index].artists.length; i++) {
    if (i > 0) {
      outputHTML += " | ";
    }
    outputHTML += "<a target='_blank' href='" + allCurrInfo[index].artistURL[i] + "'>" + 
                  allCurrInfo[index].artists[i] + "</a>";
  }
  outputHTML += "</p><h3>Venue</h3><p>" + allCurrInfo[index].venue + 
                "</p><h3>Genres</h3><p>" + allCurrInfo[index].moreGenres + 
                "</p><h3>Ticket Status</h3><p>" + allCurrInfo[index].ticketStatus + 
                "</p><h3>Buy Ticket At:</h3><a target='_blank' href='" +
                allCurrInfo[index].buyTicketURL + "'>Ticketmaster</a></div>";

  if (allCurrInfo[index].seatmap != "") {
    outputHTML += "<div id='mapDiv'><img id='mapImg' src='" + allCurrInfo[index].seatmap + 
                  "'></div>"
  }

  outputHTML += "</div>"

  outputDiv.innerHTML = outputHTML;
  outputDiv.scrollIntoView();
}

// Disable the Location input form when the first radio button is clicked
function disableLoc() {
  document.getElementById("location").disabled = true;
}

// Enable the Location input form when the second radio button is clicked
function enableLoc() {
  document.getElementById("location").disabled = false;
}

// Resets all the fields and clears the results if applicable
function clearEverything() {
  document.getElementById("results").innerHTML = "";
  document.getElementById("detailWrapper").innerHTML = "";
  document.getElementById("keyword").value = "";
  document.getElementById("categoryList").value = "";
  document.getElementById("distance").value = "";
  document.getElementById("location").value = "";
  document.getElementById("locationButton").checked = false;
  document.getElementById("here").checked = true;
  document.getElementById("location").disabled = true;
}

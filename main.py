# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# [START gae_python38_app]
# [START gae_python3_app]
from flask import Flask, send_from_directory, request, jsonify
from geolib import geohash
import requests


# If `entrypoint` is not defined in app.yaml, App Engine will look for an app
# called `app` in `main.py`.
app = Flask(__name__)


@app.route('/')
def index_page():
    send_from_directory("static", "script.js")
    return send_from_directory("templates", "event.html")

@app.route("/static")
def send_js():
    return send_from_directory("static", "script.js")

@app.route('/ticketmaster', methods = ["GET"])
def returnAPIData():
    categoryDict = {"KZFzniwnSyZfZ7v7nJ":"Music", "KZFzniwnSyZfZ7v7nE":"Sports", 
                    "KZFzniwnSyZfZ7v7na": "Arts & Theatre", "KZFzniwnSyZfZ7v7nn": "Film", 
                    "KZFzniwnSyZfZ7v7n1": "Miscellaneous"}
    # Convert lat and lng values to a geohash
    keyword = request.args.get("keyword")
    category = request.args.get("category")
    distance = request.args.get("distance")
    geoVal = geohash.encode(request.args.get("loc1"), request.args.get("loc2"), 7)

    requestURL = "https://app.ticketmaster.com/discovery/v2/events.json?apikey=7PhcQTBX7M3JrEdFwRNzTYmOGcAjFx0P&keyword="
    requestURL += ",".join(keyword.split())
    if category:
        requestURL += "&segmentId=" + category
    requestURL += "&radius=" + distance + "&unit=miles&geoPoint=" + geoVal

    outputData = requests.get(requestURL).json()

    # If the search did not return any results
    if outputData["page"]["totalPages"] == 0:
        return jsonify({"status":"empty"})

    count = 0
    cleanEvents = {}
    for event in outputData["_embedded"]["events"]:
        if count >= 20:
            break

        # Process all the data to be returned in an accessible format
        newEntry = {"date":"N/A", "icon":"N/A", "event":"N/A", "genre":"N/A", "venue":"N/A", 
                    "artists":[], "artistURL":[], "moreGenres":"", "priceRange":"", 
                    "ticketStatus":"", "buyTicketURL":"", "seatmap":""}
        if "dates" in event:
            if "start" in event["dates"]:
                if "localDate" in event["dates"]["start"]:
                    newEntry["date"] = event["dates"]["start"]["localDate"]
                if "localTime" in event["dates"]["start"]:
                    newEntry["date"] += " " + event["dates"]["start"]["localTime"]
            if "status" in event["dates"]:
                if "code" in event["dates"]["status"]:
                    newEntry["ticketStatus"] = event["dates"]["status"]["code"]
        if "images" in event:
            newEntry["icon"] = event["images"][0]["url"]
        if "name" in event:
            newEntry["event"] = event["name"]
        if "classifications" in event:
            if "segment" in event["classifications"][0] and category == "":
                temp = event["classifications"][0]
                if "name" in temp["segment"]:
                    newEntry["genre"] = temp["segment"]["name"]
            else:
                newEntry["genre"] = categoryDict[category]
            for curr in event["classifications"][0]:
                if curr == "primary" or curr == "family":
                    continue

                newCurr = event["classifications"][0][curr]
                if "name" in newCurr:
                    if newCurr["name"] != "Undefined":
                        if newEntry["moreGenres"]:
                            newEntry["moreGenres"] += " | "
                        newEntry["moreGenres"] += newCurr["name"]
        if "_embedded" in event:
            if "venues" in event["_embedded"]:
                if "name" in event["_embedded"]["venues"][0]:
                    newEntry["venue"] = event["_embedded"]["venues"][0]["name"]
            if "attractions" in event["_embedded"]:
                for curr in event["_embedded"]["attractions"]:
                    if "name" in curr:
                        newEntry["artists"].append(curr["name"])
                        newEntry["artistURL"].append(curr["url"])
        if "priceRanges" in event:
            if "min" in event["priceRanges"][0]:
                newEntry["priceRange"] += str(event["priceRanges"][0]["min"])
            if "max" in event["priceRanges"][0]:
                newEntry["priceRange"] += " - " + str(event["priceRanges"][0]["max"])
            if "currency" in event["priceRanges"][0]:
                newEntry["priceRange"] += " " + event["priceRanges"][0]["currency"]
        if "url" in event:
            newEntry["buyTicketURL"] = event["url"]
        if "seatmap" in event:
            if "staticUrl" in event["seatmap"]:
                newEntry["seatmap"] = event["seatmap"]["staticUrl"]

        cleanEvents[count] = newEntry
        count += 1

    return cleanEvents

if __name__ == '__main__':
    # This is used when running locally only. When deploying to Google App
    # Engine, a webserver process such as Gunicorn will serve the app. This
    # can be configured by adding an `entrypoint` to app.yaml.

    app.run(host='127.0.0.1', port=8080, debug=True)
    #keyword = "Hamilton"
    #category = ""
    #distance = "10"
    #geoVal = "9q5cs"
# [END gae_python3_app]
# [END gae_python38_app]

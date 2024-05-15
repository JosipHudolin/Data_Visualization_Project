// Set dimensions of the SVG element
const width = 800;
const height = 600;

// Create an SVG element
const svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

// Define a projection and path generator
const projection = d3.geoMercator()
    .center([13, 52]) // Center the map on Europe
    .scale(600) // Scale the map
    .translate([width / 2, height / 2]); // Move the map to fit in the SVG

const path = d3.geoPath().projection(projection);

// Load the GeoJSON data
d3.json("europe.geojson").then(function(geoData) {
    console.log("GeoJSON data:", geoData); // Log the data to verify it is loaded correctly
    
    // Bind data and create one path per GeoJSON feature
    svg.selectAll("path")
        .data(geoData.features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", "lightblue")
        .attr("stroke", "black")
        .attr("stroke-width", 0.5);

    // Load the AirMissions data
    d3.json("AirMissions.json").then(function(missionData) {
        console.log("AirMissions data:", missionData); // Log the data to verify it is loaded correctly

        // Add circles for each mission
        svg.selectAll("circle")
            .data(missionData)
            .enter().append("circle")
            .attr("cx", function(d) {
                return projection([d.LONGITUDE, d.LATITUDE])[0];
            })
            .attr("cy", function(d) {
                return projection([d.LONGITUDE, d.LATITUDE])[1];
            })
            .attr("r", 3)
            .attr("fill", "red")
            .attr("stroke", "black")
            .attr("stroke-width", 0.5)
            .append("title")  // Add tooltip
            .text(function(d) {
                return d.name;
            });
    }).catch(function(error) {
        console.error("Error loading the AirMissions data:", error);
    });
}).catch(function(error) {
    console.error("Error loading the GeoJSON data:", error);
});

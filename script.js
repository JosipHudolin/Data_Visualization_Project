// Set dimensions of the SVG element
const width = 1400;
const height = 600;

// Create an SVG element
const svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height)
    .call(d3.zoom().on("zoom", zoomed))
    .append("g");

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

        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Add icons for each mission
        svg.selectAll("g.icon")
        .data(missionData)
        .enter().append("g")
        .attr("class", "icon")
        .attr("transform", function(d) {
            return "translate(" + projection([d.LONGITUDE, d.LATITUDE]) + ")";
        })
        .on("mouseover", function(event, d) { // Pass event and data
            const tooltipWidth = 150; // Set tooltip width
            const tooltipHeight = 50; // Set tooltip height
            const tooltipX = event.pageX + 10; // Position tooltip slightly to the right of the mouse pointer
            const tooltipY = event.pageY - 20; // Position tooltip slightly above the mouse pointer

            // Transition and display tooltip
            tooltip.transition()
                .duration(200)
                .style("opacity", .9)
                .style("left", tooltipX + "px")
                .style("top", tooltipY + "px");

            // Populate tooltip with data
            tooltip.html("TGTLOCATION: " + d.TGTLOCATION + "<br/>" + "DATE: " + d.MSNDATE);
        })
        .on("mouseout", function(event, d) { // Pass event and data
            // Hide tooltip on mouseout
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .append("image")
        .attr("xlink:href", "icons/nuclear-explosion.png")
        .attr("x", -12.5)
        .attr("y", -12.5)
        .attr("width", 25)
        .attr("height", 25);

    }).catch(function(error) {
        console.error("Error loading the AirMissions data:", error);
    });
}).catch(function(error) {
    console.error("Error loading the GeoJSON data:", error);
});

// Zoom function
function zoomed(event) {
    svg.attr("transform", event.transform);
    
    // Reset the size of the icons to maintain fixed size during zoom
    svg.selectAll("image")
        .attr("width", 25 / event.transform.k) // Set the width of the icon inversely proportional to zoom level
        .attr("height", 25 / event.transform.k); // Set the height of the icon inversely proportional to zoom level
}

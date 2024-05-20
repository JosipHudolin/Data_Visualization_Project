// Set dimensions of the SVG element
const width = 1400;
const height = 700;

// Attach event listeners to filter inputs
document.getElementById("country").addEventListener("change", applyFilters);
document.getElementById("month").addEventListener("change", applyFilters);
document.getElementById("year").addEventListener("change", applyFilters);

// Define the applyFilters function
function applyFilters() {
  const targetCountry = document.getElementById("country").value;
  const targetMonth = document.getElementById("month").value;
  const targetYear = document.getElementById("year").value;

  // Filter the mission data based on the specified criteria
  const filteredMissionData = missionData.filter(function(mission) {
    const missionDate = new Date(mission.MSNDATE);
    const missionCountry = mission.TGTCOUNTRY;
    const missionMonth = missionDate.getMonth() + 1;
    const missionYear = missionDate.getFullYear();

    // Check if the mission meets the filtering criteria
    const countryMatch = targetCountry === "All" || missionCountry === targetCountry;
    const monthMatch = targetMonth === "All" || missionMonth === parseInt(targetMonth);
    const yearMatch = targetYear === "All" || missionYear === parseInt(targetYear);

    return countryMatch && monthMatch && yearMatch;
  });

  // Use the filtered mission data for further processing or visualization
}
  

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

// Define a line generator with custom interpolation for a curved line
const lineGenerator = d3.line()
    .x(d => d[0])
    .y(d => d[1])
    .curve(d3.curveBasis); // Use basis curve for smooth interpolation

function calculateTakeoffBaseDetails(takeoffBase, missionData) {
        // Filter mission data for the specified takeoff base
    const missionsFromBase = missionData.filter(mission => mission.TAKEOFFBASE === takeoffBase);
        
        // Calculate total number of missions, planes, and bombs
    const totalMissions = missionsFromBase.length;
    const totalPlanes = missionsFromBase.reduce((total, mission) => total + mission.NUMBEROFPLANESATTACKING, 0);
    const totalBombs = missionsFromBase.reduce((total, mission) => total + mission.BOMBLOAD, 0);
    
    return { totalMissions, totalPlanes, totalBombs };
}

// Load the GeoJSON data
d3.json("europe.geojson").then(function(geoData) {
    console.log("GeoJSON data:", geoData); // Log the data to verify it is loaded correctly
    
    // Bind data and create one path per GeoJSON feature
    svg.selectAll("path")
        .data(geoData.features)
        .enter().append("path")
        .attr("d", path)
        .attr("fill", "#d3d3d3") // Set map color to #d3d3d3
        .attr("stroke", "black")
        .attr("stroke-width", 0.5);

    // Load the AirMissions data
    d3.json("AirMissions.json").then(function(filteredMissionData) {
        console.log("AirMissions data:", filteredMissionData); // Log the data to verify it is loaded correctly

        // Add icons for each mission
        svg.selectAll("g.icon")
            .data(filteredMissionData)
            .enter().append("g")
            .attr("class", "icon")
            .append("image")
            .attr("xlink:href", "icons/nuclear-explosion.png")
            .attr("x", -5)
            .attr("y", -5)
            .attr("width", 25)
            .attr("height", 25)
            .attr("transform", function(d) {
                return "translate(" + projection([d.LONGITUDE, d.LATITUDE]) + ")";
            })
            .on("mouseover", function(event, d) {
                // Display tooltip on mouseover
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);

                tooltip.html("<div class='tooltip-text'><strong>Location:</strong> " + d.TGTLOCATION + "<br/><strong>Date:</strong> " + d.MSNDATE + "</div>");
            })
            .on("mousemove", function(event) {
                // Update tooltip position on mousemove
                tooltip.style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 15) + "px");
            })
            .on("mouseout", function() {
                // Hide tooltip on mouseout
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("click", function(event, d) {
                // Display detailed info in the detail view on click
                const detailView = document.getElementById("detailView");
                const detailData = document.getElementById("detailData");
                detailData.innerHTML = `
                    <strong>Country:</strong> ${d.COUNTRY}<br/>
                    <strong>Service:</strong> ${d.SERVICE}<br/>
                    <strong>Unit:</strong> ${d.UNIT}<br/>
                    <strong>Mission Design Series:</strong> ${d.MDS}<br/>
                    <strong>Number of Planes Attacking:</strong> ${d.NUMBEROFPLANESATTACKING}<br/>
                    <strong>Bomb Load:</strong> ${d.BOMBLOAD}<br/>
                    <strong>Target Location:</strong> ${d.TGTLOCATION}<br/>
                    <strong>Target Country:</strong> ${d.TGTCOUNTRY}<br/>
                    <strong>Target Type:</strong> ${d.TGTTYPE}
                `;
                detailView.style.display = "block";
                const takeoffBase = d.TAKEOFFBASE;
                const { totalMissions, totalPlanes, totalBombs } = calculateTakeoffBaseDetails(takeoffBase, filteredMissionData);
            
                // Filter the takeoff base data to get only the matching takeoff base
                const filteredTakeoffBaseData = filteredMissionData.filter(function(takeoffBase) {
                    return takeoffBase.TAKEOFFBASE === d.TAKEOFFBASE;
                });
            
                // Remove existing takeoff base icons
                svg.selectAll(".takeoff-base-icon").remove();
            
                // Append the filtered takeoff base icons
                const takeoffIcons = svg.selectAll(".takeoff-base-icon")
                    .data(filteredTakeoffBaseData)
                    .enter().append("g")
                    .attr("class", "takeoff-base-icon");
            
                takeoffIcons.append("image")
                    .attr("xlink:href", "icons/takeoff-the-plane.png") // Adjust the image URL accordingly
                    .attr("x", -12.5)
                    .attr("y", -12.5)
                    .attr("width", 25)
                    .attr("height", 25)
                    .attr("transform", function(d) {
                        return "translate(" + projection([d.TAKEOFFLONGITUDE, d.TAKEOFFLATITUDE]) + ")";
                    })
                    .on("mouseover", function(event, d) {
                        // Display tooltip on mouseover
                        tooltip.transition()
                            .duration(200)
                            .style("opacity", .9);
                        tooltip.html("<div class='tooltip-text'><strong>Takeoff Base:</strong> " + d.TAKEOFFBASE + "</div>");
                    })
                    .on("mousemove", function(event) {
                        // Update tooltip position on mousemove
                        tooltip.style("left", (event.pageX + 15) + "px")
                            .style("top", (event.pageY - 15) + "px");
                    })
                    .on("mouseout", function() {
                        // Hide tooltip on mouseout
                        tooltip.transition()
                            .duration(500)
                            .style("opacity", 0);
                    })
                    .on("click", function(event, d) {
                        // Display detailed info in the takeoff detail view on click
                        const takeoffDetailView = document.getElementById("takeoffDetailView");
                        const takeoffDetailData = document.getElementById("takeoffDetailData");
                        takeoffDetailData.innerHTML = `
                            <strong>Takeoff Base:</strong> ${d.TAKEOFFBASE}<br/>
                            <strong>Number Of Missions:</strong> ${totalMissions}<br/>
                            <strong>Number Of Planes:</strong> ${totalPlanes}<br/>
                            <strong>Amount Of Bombs:</strong> ${totalBombs}<br/>
                        `;
                        takeoffDetailView.style.display = "block";
                    });
            

                // Update icon size dynamically based on zoom level
        function updateIconSize() {
            const zoomLevel = d3.zoomTransform(svg.node()).k;
            svg.selectAll(".takeoff-marker")
                .attr("width", 25 / zoomLevel)
                .attr("height", 25 / zoomLevel);
        }

        svg.call(d3.zoom().on("zoom", function(event) {
            zoomed(event);
            updateIconSize();
        }));

        updateIconSize();
    });
    }).catch(function(error) {
        console.error("Error loading the AirMissions data:", error);
    });
}).catch(function(error) {
    console.error("Error loading the GeoJSON data:", error);
});

// Add a tooltip div
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip"); // Apply the tooltip class

// Zoom function
function zoomed(event) {
    svg.attr("transform", event.transform);
    
    // Reset the size of the icons to maintain fixed size during zoom
    svg.selectAll("image")
        .attr("width", 25 / event.transform.k) // Set the width of the icon inversely proportional to zoom level
        .attr("height", 25 / event.transform.k); // Set the height of the icon inversely proportional to zoom level
}

document.addEventListener("DOMContentLoaded", function() {
    applyFilters();
  });

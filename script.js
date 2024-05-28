// Set dimensions of the SVG element
const width = 1400;
const height = 650;

// Global mission data variable
let missionData = [];

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
        .attr("fill", "#FAA0A0")
        .attr("stroke", "black")
        .attr("stroke-width", 0.5);

    // Load the AirMissions data
    d3.json("AirMissions.json").then(function(data) {
        missionData = data;
        console.log("AirMissions data:", missionData); // Log the data to verify it is loaded correctly
        applyFilters(); // Call applyFilters after loading the data
    }).catch(function(error) {
        console.error("Error loading the AirMissions data:", error);
    });
}).catch(function(error) {
    console.error("Error loading the GeoJSON data:", error);
});

// Attach event listeners to filter inputs
document.getElementById("country").addEventListener("change", applyFilters);
document.getElementById("month").addEventListener("change", applyFilters);
document.getElementById("year").addEventListener("change", applyFilters);

// Declare a global variable to store filtered data
let filteredMissionData = [];

// Define the applyFilters function
function applyFilters() {
    const targetCountry = document.getElementById("country").value;
    const targetMonth = document.getElementById("month").value;
    const targetYear = document.getElementById("year").value;

    // Filter the mission data based on the specified criteria
    filteredMissionData = missionData.filter(function(mission) {
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
    // Call functions to update visualization or generate charts with filteredMissionData
    updateVisualization(filteredMissionData);
}


// Function to update the visualization with filtered data
function updateVisualization(filteredData) {
    // Clear existing icons
    svg.selectAll(".icon").remove();

    // Add icons for each filtered mission
    svg.selectAll("g.icon")
        .data(filteredData)
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
            const { totalMissions, totalPlanes, totalBombs } = calculateTakeoffBaseDetails(takeoffBase, filteredData);

            // Filter the takeoff base data to get only the matching takeoff base
            const filteredTakeoffBaseData = filteredData.filter(function(takeoffBase) {
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
                .attr("xlink:href", "icons/airport-2.png") // Adjust the image URL accordingly
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
            // Function to update icon size dynamically based on zoom level
                function updateIconSize() {
                    const zoomLevel = d3.zoomTransform(svg.node()).k;
                    svg.selectAll("image")
                        .attr("width", 25 / zoomLevel)
                        .attr("height", 25 / zoomLevel);
                }

                // Initial update of icon size
                updateIconSize();

                // Zoom function
                function zoomed(event) {
                    svg.attr("transform", event.transform);

                    // Update icon size dynamically based on zoom level
                    updateIconSize();
                }

                // Call the zoom function on the SVG element
                svg.call(d3.zoom().on("zoom", zoomed))
        });
}

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

function calculateTakeoffBaseDetails(takeoffBase, missionData) {
    const missionsFromBase = missionData.filter(mission => mission.TAKEOFFBASE === takeoffBase);

    const totalMissions = missionsFromBase.length;
    const totalPlanes = missionsFromBase.reduce((total, mission) => total + mission.NUMBEROFPLANESATTACKING, 0);
    const totalBombs = missionsFromBase.reduce((total, mission) => total + mission.BOMBLOAD, 0);

    return { totalMissions, totalPlanes, totalBombs };
}

// Get the button that opens the modal
const openModalBtn = document.getElementById("openModalBtn");

// When the user clicks the button, open the modal and generate charts
openModalBtn.addEventListener("click", function() {
    // Apply filters and open modal
    applyFilters();
    openModal(filteredMissionData);
});

function openModal(filteredData) {
    // Get the modal element
    var modal = document.getElementById("myModal");

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    // When the user clicks the button, open the modal
    modal.style.display = "block";

    // Regenerate pie charts with filtered data
    generatePieCharts(filteredData);

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}

// Function to generate all four pie charts
function generatePieCharts(filteredData) {
    // Calculate the number of missions for each country
    const missionCountsByCountry = filteredData.reduce((counts, mission) => {
        counts[mission.COUNTRY] = (counts[mission.COUNTRY] || 0) + 1;
        return counts;
    }, {});

    // Convert the mission counts into an array of objects
    const missionsPerCountryData = Object.entries(missionCountsByCountry).map(([country, count]) => ({
        COUNTRY: country,
        count: count
    }));

    // Generate pie chart for amount of missions per country
    generatePieChart(missionsPerCountryData, 'missionsPerCountryChart', 'COUNTRY', 'Amount of Bomb Missions per Country');

    // Group the data by target country and count the number of missions
    const missionCountsByTargetCountry = filteredData.reduce((counts, mission) => {
        counts[mission.TGTCOUNTRY] = (counts[mission.TGTCOUNTRY] || 0) + 1;
        return counts;
    }, {});

    // Convert the mission counts by target country into an array of objects
    const missionsPerTargetCountryData = Object.entries(missionCountsByTargetCountry).map(([country, count]) => ({
        TGTCOUNTRY: country,
        count: count
    }));

    // Generate pie chart for amount of bomb missions per target country
    generatePieChart(missionsPerTargetCountryData, 'missionsPerTargetCountryChart', 'TGTCOUNTRY', 'Amount of Bomb Missions per Target Country');

    // Group the data by country and sum the number of bombs
    const bombCountsByCountry = filteredData.reduce((counts, mission) => {
        counts[mission.COUNTRY] = (counts[mission.COUNTRY] || 0) + mission.BOMBLOAD;
        return counts;
    }, {});

    // Convert the bomb counts into an array of objects
    const bombsPerCountryData = Object.entries(bombCountsByCountry).map(([country, count]) => ({
        COUNTRY: country,
        count: count
    }));

    // Generate pie chart for amount of bombs per country
    generatePieChart(bombsPerCountryData, 'bombsPerCountryChart', 'COUNTRY', 'Amount of Bombs per Country');

    // Group the data by target country and sum the number of bombs
    const bombCountsByTargetCountry = filteredData.reduce((counts, mission) => {
        counts[mission.TGTCOUNTRY] = (counts[mission.TGTCOUNTRY] || 0) + mission.BOMBLOAD;
        return counts;
    }, {});

    // Convert the bomb counts by target country into an array of objects
    const bombsPerTargetCountryData = Object.entries(bombCountsByTargetCountry).map(([country, count]) => ({
        TGTCOUNTRY: country,
        count: count
    }));

    // Generate pie chart for amount of bombs per target country
    generatePieChart(bombsPerTargetCountryData, 'bombsPerTargetCountryChart', 'TGTCOUNTRY', 'Amount of Bombs per Target Country');
}



function generatePieChart(data, chartId, groupBy, title, valueKey = "count") {
    try {
        // Destroy existing chart if it exists
        var existingChart = Chart.getChart(chartId);
        if (existingChart) {
            existingChart.destroy();
        }

        // Group data by the specified key
        const groupedData = _.groupBy(data, groupBy);

        // Calculate sum for each group
        const aggregatedData = _.map(groupedData, (values, key) => ({
            [groupBy]: key,
            [valueKey]: _.sumBy(values, valueKey)
        }));

        // Define custom colors for each country (add more colors as needed)
        const customColors = {
            'USA': '#454b1b',
            'UK': '#534633',
            'AUSTRIA': '#4d5d53',
            'ITALY': '#e7dfc7',
            'SWITZERLAND': '#313445',
            'BELGIUM': '#000000',
            'GERMANY': '#4D5D53',
            'FRANCE': '#4889a7',
            'LUXEMBOURG': '#B25B2E',
        };

        // Create pie chart
        var ctx = document.getElementById(chartId).getContext('2d');
        var myChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: aggregatedData.map(entry => entry[groupBy]),
                datasets: [{
                    label: title,
                    data: aggregatedData.map(entry => entry[valueKey]),
                    backgroundColor: aggregatedData.map(entry => customColors[entry[groupBy]]),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true
            }
        });
    } catch (error) {
        console.error("Error generating pie chart:", error);
    }
}






function generateRandomColors(numColors) {
    var colors = [];
    for (var i = 0; i < numColors; i++) {
        var r = Math.floor(Math.random() * 256);
        var g = Math.floor(Math.random() * 256);
        var b = Math.floor(Math.random() * 256);
        colors.push(`rgb(${r}, ${g}, ${b})`);
    }
    return colors;
}
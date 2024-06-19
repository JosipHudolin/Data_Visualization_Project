const width = 1500;
const height = 650;

let missionData = [];

const svg = d3
    .select("svg")
    .attr("width", width)
    .attr("height", height)
    .call(d3.zoom().on("zoom", zoomed))
    .append("g");

const projection = d3
    .geoMercator()
    .center([13, 52])
    .scale(600)
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

d3.json("europe.geojson")
    .then(function (geoData) {
        console.log("GeoJSON data:", geoData);

        svg.selectAll("path")
            .data(geoData.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", "#FAA0A0")
            .attr("stroke", "black")
            .attr("stroke-width", 0.5);

        d3.json("AirMissions.json")
            .then(function (data) {
                missionData = data;
                console.log("AirMissions data:", missionData);
                applyFilters();
            })
            .catch(function (error) {
                console.error("Error loading the AirMissions data:", error);
            });
    })
    .catch(function (error) {
        console.error("Error loading the GeoJSON data:", error);
    });

document.getElementById("country").addEventListener("change", applyFilters);
document.getElementById("month").addEventListener("change", applyFilters);
document.getElementById("year").addEventListener("change", applyFilters);

let filteredMissionData = [];

function applyFilters() {
    const targetCountry = document.getElementById("country").value;
    const targetMonth = document.getElementById("month").value;
    const targetYear = document.getElementById("year").value;

    filteredMissionData = missionData.filter(function (mission) {
        const missionDate = new Date(mission.MSNDATE);
        const missionCountry = mission.TGTCOUNTRY;
        const missionMonth = missionDate.getMonth() + 1;
        const missionYear = missionDate.getFullYear();

        const countryMatch =
            targetCountry === "All" || missionCountry === targetCountry;
        const monthMatch =
            targetMonth === "All" || missionMonth === parseInt(targetMonth);
        const yearMatch =
            targetYear === "All" || missionYear === parseInt(targetYear);

        return countryMatch && monthMatch && yearMatch;
    });

    updateVisualization(filteredMissionData);
    updateIconSize();
}

function updateVisualization(filteredData) {
    svg.selectAll(".icon").remove();

    svg.selectAll("g.icon")
        .data(filteredData)
        .enter()
        .append("g")
        .attr("class", "icon")
        .append("image")
        .attr("cursor", "pointer")
        .attr("xlink:href", "icons/nuclear-explosion.png")
        .attr("x", -5)
        .attr("y", -5)
        .attr("width", 25)
        .attr("height", 25)
        .attr("transform", function (d) {
            return "translate(" + projection([d.LONGITUDE, d.LATITUDE]) + ")";
        })
        .on("mouseover", function (event, d) {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(
                "<div class='tooltip-text'><strong>Location:</strong> " +
                    d.TGTLOCATION +
                    "<br/><strong>Date:</strong> " +
                    d.MSNDATE +
                    "</div>"
            );
        })
        .on("mousemove", function (event) {
            tooltip
                .style("left", event.pageX + 15 + "px")
                .style("top", event.pageY - 15 + "px");
        })
        .on("mouseout", function () {
            tooltip.transition().duration(500).style("opacity", 0);
        })
        .on("click", function (event, d) {
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
            const {
                totalMissions,
                totalPlanes,
                totalBombs,
            } = calculateTakeoffBaseDetails(takeoffBase, filteredData);

            const filteredTakeoffBaseData = filteredData.filter(function (
                takeoffBase
            ) {
                return takeoffBase.TAKEOFFBASE === d.TAKEOFFBASE;
            });

            svg.selectAll(".takeoff-base-icon").remove();

            const takeoffIcons = svg
                .selectAll(".takeoff-base-icon")
                .data(filteredTakeoffBaseData)
                .enter()
                .append("g")
                .attr("class", "takeoff-base-icon");

            takeoffIcons
                .append("image")
                .attr("cursor", "pointer")
                .attr("xlink:href", "icons/airport-2.png")
                .attr("x", -12.5)
                .attr("y", -12.5)
                .attr("width", 35)
                .attr("height", 35)
                .attr("transform", function (d) {
                    return (
                        "translate(" +
                        projection([d.TAKEOFFLONGITUDE, d.TAKEOFFLATITUDE]) +
                        ")"
                    );
                })
                .on("mouseover", function (event, d) {
                    tooltip.transition().duration(200).style("opacity", 0.9);
                    tooltip.html(
                        "<div class='tooltip-text'><strong>Takeoff Base:</strong> " +
                            d.TAKEOFFBASE +
                            "</div>"
                    );
                })
                .on("mousemove", function (event) {
                    tooltip
                        .style("left", event.pageX + 15 + "px")
                        .style("top", event.pageY - 15 + "px");
                })
                .on("mouseout", function () {
                    tooltip.transition().duration(500).style("opacity", 0);
                })
                .on("click", function (event, d) {
                    const takeoffDetailView = document.getElementById(
                        "takeoffDetailView"
                    );
                    const takeoffDetailData = document.getElementById(
                        "takeoffDetailData"
                    );
                    takeoffDetailData.innerHTML = `
                        <strong>Takeoff Base:</strong> ${d.TAKEOFFBASE}<br/>
                        <strong>Number Of Missions:</strong> ${totalMissions}<br/>
                        <strong>Total Planes Attacking:</strong> ${totalPlanes}<br/>
                        <strong>Total Bomb Load:</strong> ${totalBombs} lbs<br/>
                    `;
                    takeoffDetailView.style.display = "block";
                });
                updateIconSize();
        });
}

function calculateTakeoffBaseDetails(takeoffBase, data) {
    let totalMissions = 0;
    let totalPlanes = 0;
    let totalBombs = 0;

    data.forEach(function (d) {
        if (d.TAKEOFFBASE === takeoffBase) {
            totalMissions++;
            totalPlanes += parseInt(d.NUMBEROFPLANESATTACKING);
            totalBombs += parseInt(d.BOMBLOAD);
        }
    });

    return { totalMissions, totalPlanes, totalBombs };
}

const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

function zoomed(event) {
    svg.attr("transform", event.transform);
    updateIconSize();
}

function updateIconSize() {
    const currentZoom = d3.zoomTransform(svg.node()).k;
    const iconSize = 25 / currentZoom;

    svg.selectAll(".icon image")
        .attr("width", iconSize)
        .attr("height", iconSize)
        .attr("x", -iconSize / 2)
        .attr("y", -iconSize / 2);

    svg.selectAll(".takeoff-base-icon image")
        .attr("width", 35 / currentZoom)
        .attr("height", 35 / currentZoom)
        .attr("x", -iconSize / 2)
        .attr("y", -iconSize / 2);
}


const openModalBtn = document.getElementById("openModalBtn");

openModalBtn.addEventListener("click", function () {
    applyFilters();
    openModal(filteredMissionData);
});

function openModal(filteredData) {
    var modal = document.getElementById("myModal");

    var span = document.getElementsByClassName("close")[0];

    modal.style.display = "block";

    generatePieCharts(filteredData);

    span.onclick = function () {
        modal.style.display = "none";
    };

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
}

function generatePieCharts(filteredData) {
    const missionCountsByCountry = filteredData.reduce((counts, mission) => {
        counts[mission.COUNTRY] = (counts[mission.COUNTRY] || 0) + 1;
        return counts;
    }, {});

    const missionsPerCountryData = Object.entries(missionCountsByCountry).map(
        ([country, count]) => ({
            COUNTRY: country,
            count: count,
        })
    );

    generatePieChart(
        missionsPerCountryData,
        "missionsPerCountryChart",
        "COUNTRY",
        "Amount of Bomb Missions per Country"
    );

    const missionCountsByTargetCountry = filteredData.reduce(
        (counts, mission) => {
            counts[mission.TGTCOUNTRY] = (counts[mission.TGTCOUNTRY] || 0) + 1;
            return counts;
        },
        {}
    );

    const missionsPerTargetCountryData = Object.entries(
        missionCountsByTargetCountry
    ).map(([country, count]) => ({
        TGTCOUNTRY: country,
        count: count,
    }));

    generatePieChart(
        missionsPerTargetCountryData,
        "missionsPerTargetCountryChart",
        "TGTCOUNTRY",
        "Amount of Bomb Missions per Target Country"
    );

    const bombCountsByCountry = filteredData.reduce((counts, mission) => {
        counts[mission.COUNTRY] =
            (counts[mission.COUNTRY] || 0) + mission.BOMBLOAD;
        return counts;
    }, {});

    const bombsPerCountryData = Object.entries(bombCountsByCountry).map(
        ([country, count]) => ({
            COUNTRY: country,
            count: count,
        })
    );

    generatePieChart(
        bombsPerCountryData,
        "bombsPerCountryChart",
        "COUNTRY",
        "Amount of Bombs per Country"
    );

    const bombCountsByTargetCountry = filteredData.reduce((counts, mission) => {
        counts[mission.TGTCOUNTRY] =
            (counts[mission.TGTCOUNTRY] || 0) + mission.BOMBLOAD;
        return counts;
    }, {});

    const bombsPerTargetCountryData = Object.entries(
        bombCountsByTargetCountry
    ).map(([country, count]) => ({
        TGTCOUNTRY: country,
        count: count,
    }));

    generatePieChart(
        bombsPerTargetCountryData,
        "bombsPerTargetCountryChart",
        "TGTCOUNTRY",
        "Amount of Bombs per Target Country"
    );
}

function generatePieChart(data, chartId, groupBy, title, valueKey = "count") {
    try {
        var existingChart = Chart.getChart(chartId);
        if (existingChart) {
            existingChart.destroy();
        }

        const groupedData = _.groupBy(data, groupBy);

        const aggregatedData = _.map(groupedData, (values, key) => ({
            [groupBy]: key,
            [valueKey]: _.sumBy(values, valueKey),
        }));

        const customColors = {
            USA: "#454b1b",
            UK: "#534633",
            AUSTRIA: "#4d5d53",
            ITALY: "#e7dfc7",
            SWITZERLAND: "#313445",
            BELGIUM: "#000000",
            GERMANY: "#4D5D53",
            FRANCE: "#4889a7",
            LUXEMBOURG: "#B25B2E",
        };

        var ctx = document.getElementById(chartId).getContext("2d");
        var myChart = new Chart(ctx, {
            type: "pie",
            data: {
                labels: aggregatedData.map((entry) => entry[groupBy]),
                datasets: [
                    {
                        label: title,
                        data: aggregatedData.map((entry) => entry[valueKey]),
                        backgroundColor: aggregatedData.map(
                            (entry) => customColors[entry[groupBy]]
                        ),
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: true,
            },
        });
    } catch (error) {
        console.error("Error generating pie chart:", error);
    }
}

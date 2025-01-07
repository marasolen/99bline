let roads, stops, years, annotations, yearRouteLengthMap;

const colours = ["#f0c14a", "#1f212d"];

const routeHalfWidthMultiplier = 0.03;
const routeCurveMultiplier = 0.015;

const resizeAndRender = () => {
    d3.selectAll("svg > *").remove();

    d3.select("svg").attr("width", 1.3 * document.getElementById("visualization").clientHeight)

    renderVisualization(roads, years);

    d3.selectAll("text").attr("font-size", function() { return d3.select(this).attr("text-multiplier") * 0.012 * document.getElementById("visualization").clientWidth })
    d3.selectAll("tspan").attr("font-size", function() { return d3.select(this).attr("text-multiplier") * 0.012 * document.getElementById("visualization").clientWidth })

    d3.select("#disclaimer").style("display", +d3.select("svg").attr("width") > window.innerWidth ? "block" : "none");
};

window.onresize = resizeAndRender;

const renderVisualization = (roads, years) => {
    const containerWidth = document.getElementById("visualization").clientWidth;
    const containerHeight = document.getElementById("visualization").clientHeight;

    const margin = {
        top: 0.1 * containerHeight,
        right: 0 * containerWidth,
        bottom: 0.18 * containerHeight,
        left: 0.07 * containerWidth
    };

    const width = containerWidth - (margin.right + margin.left);
    const height = containerHeight - (margin.top + margin.bottom);

    const timelineWidth = width * 0.01;
    const arrowWidth = width * 0.09;
    const routeWidth = width * 0.87;

    const xValue = d => d.position;
    const xScale = d3.scaleLinear().domain([0, 26.7]).range([margin.left, routeWidth - margin.left]);
    const yValue = d => d.year;
    const yScale = d3.scaleBand().domain(years.map(yValue)).range([0, height]);

    const timelineScale = d3.scaleLinear().domain([1996, 2026.2]).range([0, height]);

    const xAxis = d3.axisBottom(xScale)
        .tickValues(roads.map(road => xValue(road)))
        .tickFormat(position => {
            let roadName = "ERROR";
            roads.forEach(road => {
                if (road.position === position) {
                    roadName = road.name;
                }
            });
            return roadName;
        })
        .tickSize(height)
        .tickPadding(0.01 * height);

    const yAxis = d3.axisLeft(timelineScale)
        .tickValues(years.map(yValue))
        .tickFormat(d3.format('.0f'))
        .tickSize(0)
        .tickPadding(0.003 * width);

    const svg = d3.select("svg");

    svg.append('defs')
        .append('clipPath')
        .attr('id', 'chart-mask')
        .append('rect')
        .attr('width', width)
        .attr('y', -margin.top)
        .attr('height', containerHeight);

    const chartArea = svg.append('g')
        .attr("clip-path", "url(#chart-mask)")
        .attr('transform', `translate(0,${margin.top})`);

    // Render timeline
    const timeline = chartArea.append("g")
        .attr("transform", `translate(${margin.left}, 0)`);

    timeline.selectAll(".time-period")
        .data(years)
        .join("rect")
        .attr("width", timelineWidth)
        .attr("height", (d, i) => (i === years.length - 1) ? timelineScale(yValue(d) + 0.2) - timelineScale(yValue(d)) : timelineScale(yValue(years[i + 1])) - timelineScale(yValue(d)))
        .attr("y", d => timelineScale(yValue(d)))
        .attr("fill", (_, i) => colours[i % 2]);

    const yAxisG = timeline.append('g')
        .attr('class', 'axis y-axis');

    // Render connecting arrows
    const arrows = chartArea.append("g")
        .attr("transform", `translate(${margin.left + timelineWidth}, 0)`);

    arrows.append('defs').append('marker')
        .attr('id', 'arrow-head-0')
        .attr('markerUnits', 'strokeWidth')
        .attr('refX', "2")
        .attr('refY', "2")
        .attr('markerWidth', 0.01 * height)
        .attr('markerHeight', 0.01 * height)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,0 L2,2 L 0,4')
        .attr('stroke', colours[0])
        .attr('fill', 'none');

    arrows.append('defs').append('marker')
        .attr('id', 'arrow-head-1')
        .attr('markerUnits', 'strokeWidth')
        .attr('refX', "2")
        .attr('refY', "2")
        .attr('markerWidth', 0.01 * height)
        .attr('markerHeight', 0.01 * height)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,0 L2,2 L 0,4')
        .attr('stroke', colours[1])
        .attr('fill', 'none');

    arrows.selectAll(".arrows")
        .data(years)
        .join("path")
        .attr("class", (_, i) => "arrows arrow-head-" + (i % 2))
        .attr("d", (d, i) => {
            const startY = ((i === years.length - 1 ? timelineScale(yValue(d) + 0.2) : timelineScale(yValue(years[i + 1]))) + timelineScale(yValue(d))) / 2;
            const path = d3.path();
            path.moveTo(0, startY);
            path.quadraticCurveTo(
                arrowWidth / 2, 
                startY, 
                arrowWidth / 2, 
                (startY + yScale(yValue(d)) + yScale.bandwidth() / 2) / 2);
            path.quadraticCurveTo(
                arrowWidth / 2, 
                yScale(yValue(d)) + yScale.bandwidth() / 2, 
                arrowWidth, 
                yScale(yValue(d)) + yScale.bandwidth() / 2);
            return path;
        })
        .attr("stroke", (_, i) => colours[i % 2])
        .attr("stroke-width", 0.005 * height)
        .attr("fill", "none")

    // Render route chart
    const chart = chartArea.append('g')
        .attr("transform", `translate(${margin.left / 1.4 + timelineWidth + arrowWidth}, 0)`);

    const xAxisG = chart.append('g')
        .attr('class', 'axis x-axis');

    const row = chart.selectAll('.row')
        .data(years)
        .join('g')
        .attr('class', 'row')
        .attr('transform', d => `translate(0,${yScale(yValue(d)) + yScale.bandwidth() / 2})`);

    const routeHalfWidth = routeHalfWidthMultiplier * height;
    const routeCurveWidth = routeCurveMultiplier * width;

    row.selectAll(".route-background")
        .data(d => [d])
        .join("rect")
        .attr("class", "route-background")
        .attr("width", d => 1.01 * xScale(d3.max(d.stops.flat(1).map(xValue))))
        .attr("height", yScale.bandwidth() * 0.8)
        .attr("x", d => margin.left / 2 - 0.005 * xScale(d3.max(d.stops.flat(1).map(xValue))))
        .attr("y", -yScale.bandwidth() * 0.4)
        .attr("fill", d => colours[d.index % 2])
        .attr("opacity", 0.2)
        .attr("rx", 0.5 * routeCurveWidth)
        .attr("ry", 0.5 * routeCurveWidth);

    row.selectAll(".route")
        .data(d => d.routes)
        .join("path")
        .attr("class", "route")
        .attr("d", d => {
            const leftMostPoint = xScale(d3.min(d.stops.flat(1).map(xValue)));
            const rightMostPoint = xScale(d3.max(d.stops.flat(1).map(xValue)));
            const path = d3.path();
            path.moveTo(leftMostPoint, -routeHalfWidth);
            path.lineTo(rightMostPoint, -routeHalfWidth);
            path.quadraticCurveTo(rightMostPoint + routeCurveWidth, -routeHalfWidth, rightMostPoint + routeCurveWidth, 0);
            path.quadraticCurveTo(rightMostPoint + routeCurveWidth, routeHalfWidth, rightMostPoint, routeHalfWidth);
            path.lineTo(leftMostPoint, routeHalfWidth);
            path.quadraticCurveTo(leftMostPoint - routeCurveWidth, routeHalfWidth, leftMostPoint - routeCurveWidth, 0);
            path.quadraticCurveTo(leftMostPoint - routeCurveWidth, -routeHalfWidth, leftMostPoint, -routeHalfWidth);
            return path;
        })
        .attr("stroke", colours[1])
        .attr("stroke-width", d => 0.01 * height * d.weight)
        .attr("fill", "none");

    row.selectAll('.mark')
        .data(d => d.stops.flat(1), d => d.name)
        .join('circle')
        .attr('class', 'mark')
        .attr('transform', d => `translate(${xScale(xValue(d))},${d.direction === "W" ? -routeHalfWidth : d.direction === "E" ? routeHalfWidth : 0})`)
        .attr("r", d => d["tag"] === "" ? 0.007 * height : 0.01 * height)
        .attr("fill", d => d["tag"] === "new" ? "#30b22e" : d["tag"] === "moved" ? "#cc2867" : colours[0])
        .attr("stroke", colours[1])
        .attr("stroke-width", 0.002 * height);

    chart.selectAll(".annotation-background")
        .data(annotations)
        .join("rect")
        .attr("class", "annotation-background")
        .attr("width", d => 0.7 * xScale(26.4 - yearRouteLengthMap[d.year]))
        .attr("height", 0.9 * yScale.bandwidth())
        .attr("x", d => xScale(yearRouteLengthMap[d.year]) + 0.3 * xScale(26.4 - yearRouteLengthMap[d.year]))
        .attr("y", d => 0.05 * yScale.bandwidth() + yScale(d.year))
        .attr("fill", colours[1]);

    chart.selectAll(".annotation-title")
        .data(annotations)
        .join("text")
        .attr("class", "annotation-title")
        .attr("fill", "white")
        .attr("text-multiplier", 1)
        .attr("transform", d => `translate(${0.02 * routeWidth + xScale(yearRouteLengthMap[d.year]) + 0.3 * xScale(26.4 - yearRouteLengthMap[d.year])}, ${0.25 * yScale.bandwidth() + yScale(d.year)})`)
        .text(d => d.year);

    chart.selectAll(".annotation-description")
        .data(annotations)
        .join("text")
        .attr("class", "annotation-description")
        .attr("fill", "white")
        .attr("transform", d => `translate(${0.02 * routeWidth + xScale(yearRouteLengthMap[d.year]) + 0.3 * xScale(26.4 - yearRouteLengthMap[d.year])}, ${0.45 * yScale.bandwidth() + yScale(d.year)})`)
        .selectAll("tspan")
        .data(d => d.description.split("\n"))
        .join("tspan")
        .attr("y", (_, i) => i * 0.18 * yScale.bandwidth())
        .attr("x", 0)
        .attr("text-multiplier", 1)
        .text(d => d);

    const legendLines = chart.selectAll(".legend-line")
        .data([{ colour: "#30b22e", size: 0.01 * height, label: "new" }, { colour: "#cc2867", size: 0.01 * height, label: "moved" }, { colour: colours[0], size: 0.007 * height, label: "unchanged" }])
        .join("g")
        .attr("class", "legend-line")
        .attr("transform", (_, i) => `translate(${0.85 * routeWidth}, ${(i * 0.2 - 0.8) * yScale.bandwidth()})`);

    legendLines.selectAll(".legend-circle")
        .data(d => [d])
        .join("circle")
        .attr('class', 'legend-circle')
        .attr('x', 0.01 * height)
        .attr("r", d => d.size)
        .attr("fill", d => d.colour)
        .attr("stroke", colours[1])
        .attr("stroke-width", 0.002 * height);

    legendLines.selectAll(".legend-label")
        .data(d => [d])
        .join("text")
        .attr("class", "legend-label")
        .attr("x", 0.03 * height)
        .attr("y", 0.007 * height)
        .attr("text-multiplier", 1)
        .text(d => d.label);

    chart.selectAll(".title")
        .data(["route and stops over the years"])
        .join("text")
        .attr("class", "title")
        .attr("transform", `translate(0, ${-yScale.bandwidth() / 2})`)
        .attr("text-multiplier", 2)
        .text(d => d);


    // Update axes
    yAxisG.call(yAxis);
    xAxisG.call(xAxis)
    
    xAxisG.selectAll("text")
        .style("text-anchor", "start")
        .attr("x", 0)
        .attr("dx", 0.01 * routeWidth)
        .attr("y", 0)
        .attr("dy", 0.012 * height)
        .attr("text-multiplier", 1)
        .attr("transform", `translate(0, ${height}) rotate(65)`);

    xAxisG.selectAll("line")
        .attr("stroke", "#cccccc")
        .attr("stroke-width", 0.004 * routeWidth)

    yAxisG.selectAll("text")
        .attr("text-multiplier", 1);

    d3.selectAll(".domain").remove();
};

Promise.all([d3.json('data/major-roads.json'), d3.json('data/stops.json'), d3.json('data/years.json'), d3.json("data/annotations.json")]).then(([roadData, stopData, yearData, annotationData]) => {       
    roads = roadData;
    stops = stopData;
    years = yearData;
    annotations = annotationData;

    yearRouteLengthMap = {};
    
    years.forEach((year, i) => {
        year.index = i;
        year.stops = year.stops.map(stopSet => typeof stopSet === "number" ? stopSet : stopSet.map(stop => {
            const stopObj = JSON.parse(JSON.stringify(stops[stop.replace(/[\!\*]*/g, "")]));
            stopObj["tag"] = stop.includes("!") ? "new" : stop.includes("*") ? "moved" : "";
            return stopObj;
        }));
        year.stops.forEach(stopSet => {
            if (typeof stopSet !== "number") {
                stopSet.forEach((stop, i) => {
                    stop.index = year.index;
                    if (i < stopSet.length - 1) {
                        stop.direction = "W";
                    } else {
                        stop.direction = "E";
                    }
                });
            }
        });

        year.routes = [];
        const routeStops = [];
        weight = 1;
        year.stops.forEach(stopSet => {
            if (typeof stopSet === "number") {
                year.routes.unshift({
                    weight: weight,
                    stops: JSON.parse(JSON.stringify(routeStops))
                });
                weight = stopSet;
            } else {
                routeStops.push(stopSet);
            }
        });
        year.routes.unshift({
            weight: weight,
            stops: JSON.parse(JSON.stringify(routeStops))
        });

        year.stops = year.stops.filter(stopSet => typeof stopSet !== "number")

        yearRouteLengthMap[year.year] = d3.max(year.stops.flat(1).map(d => d.position));
    });

    resizeAndRender();
});
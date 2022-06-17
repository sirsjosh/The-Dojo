import { db, colRef } from "./db";
import { onSnapshot } from "firebase/firestore";
import { activity } from "./main";

const btns = document.querySelectorAll("button");

const margin = { top: 40, right: 20, bottom: 50, left: 100 };
const graphWidth = 560 - margin.left - margin.right;
const graphHeight = 400 - margin.top - margin.bottom;

const svg = d3
  .select(".canvas")
  .append("svg")
  .attr("width", graphWidth + margin.left + margin.right)
  .attr("height", graphHeight + margin.top + margin.bottom);

const graph = svg
  .append("g")
  .attr("width", graphWidth)
  .attr("height", graphHeight)
  .attr("transform", `translate(${margin.left},${margin.top})`);

//scales
const x = d3.scaleTime().range([0, graphWidth]);
const y = d3.scaleLinear().range([graphHeight, 0]);

//axes groups
const xAxisGroup = graph
  .append("g")
  .attr("class", "x-axis")
  .attr("transform", `translate(0,${graphHeight})`);

const yAxisGroup = graph.append("g").attr("class", "y-axis");

//d3 line path generator
const line = d3
  .line()
  .x(function (d) {
    return x(new Date(d.date));
  })
  .y(function (d) {
    return y(d.distance);
  });

//line path elements
const path = graph.append("path");

const update = (data) => {
  data = data.filter((item) => item.activity === activity);

  //sort data based on date
  data.sort((a, b) => new Date(a.date) - new Date(b.date));
  console.log(data);

  //set scale domains
  x.domain(d3.extent(data, (d) => new Date(d.date)));
  y.domain([0, d3.max(data, (d) => d.distance)]);

  //update line data
  path
    .data([data])
    .attr("fill", "none")
    .attr("stroke", "#00bfa5")
    .attr("stroke-width", 2)
    .attr("d", line);

  //create dotted line group
  const dottedLines = graph
    .append("g")
    .attr("class", "lines")
    .style("opacity", 0);

  //create x dotted line and append to the group
  const xDottedLine = dottedLines
    .append("line")
    .attr("stroke", "#aaa")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", 4);

  //create y dotted line and append to the group
  const yDottedLine = dottedLines
    .append("line")
    .attr("stroke", "#aaa")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", 4);

  // create circles for objects
  const circles = graph.selectAll("circle").data(data);

  //remove unwanted points
  circles.exit().remove();

  //update current points
  circles
    .attr("cx", (d) => x(new Date(d.date)))
    .attr("cy", (d) => y(d.distance));

  //add new points
  circles
    .enter()
    .append("circle")
    .attr("r", 4)
    .attr("cx", (d) => x(new Date(d.date)))
    .attr("cy", (d) => y(d.distance))
    .attr("fill", "#ccc");

  graph
    .selectAll("circle")
    .on("mouseover", (e, d) => {
      d3.select(e.currentTarget)
        .transition()
        .duration(100)
        .attr("r", 8)
        .attr("fill", "#fff");

      //set x dotted line coords
      xDottedLine
        .attr("x1", x(new Date(d.date)))
        .attr("x2", x(new Date(d.date)))
        .attr("y1", graphHeight)
        .attr("y2", y(d.distance));

      //set y dotted line coords
      yDottedLine
        .attr("x1", 0)
        .attr("x2", x(new Date(d.date)))
        .attr("y1", y(d.distance))
        .attr("y2", y(d.distance));

      //show dotted line group
      dottedLines.style("opacity", 1);
    })
    .on("mouseleave", (e, d) => {
      d3.select(e.currentTarget)
        .transition()
        .duration(100)
        .attr("r", 4)
        .attr("fill", "#ccc");

      //remove dotted line group
      dottedLines.style("opacity", 0);
    });

  //create axes
  const xAxis = d3.axisBottom(x).ticks(4).tickFormat(d3.timeFormat("%b %d"));
  const yAxis = d3
    .axisLeft(y)
    .ticks(4)
    .tickFormat((d) => d + "m");

  //call axes
  xAxisGroup.call(xAxis);
  yAxisGroup.call(yAxis);

  //rotate axis text
  xAxisGroup
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .attr("text-anchor", "end");
};

const data = [];
onSnapshot(colRef, (res) => {
  res.docChanges().forEach((change) => {
    const doc = { ...change.doc.data(), id: change.doc.id };

    switch (change.type) {
      case "added":
        data.push(doc);
        break;
      case "modified":
        const index = data.findIndex((item) => item.id === doc.id);
        data[index] = doc;
        break;
      case "removed":
        data = data.filter((item) => item.id !== doc.id);
        break;
      default:
        break;
    }
  });
  update(data);
});

btns.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    //call the update function
    update(data);
  });
});

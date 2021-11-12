import * as d3 from "d3";
import * as Papa from "papaparse";

get_data().then((res, rej) => {
  links = res;
  let types = Array.from(new Set(links.map(d => d.type)));
  let data = ({nodes: Array.from(new Set(links.flatMap(l => [l.source, l.target])), id => ({id})), links});

  console.log(types, data);
});

async function get_data () {
  Papa.parse("liens.csv", {
    download: true,
    complete: function(results) {
      console.log("Finished:", results.data);
    }
  });
  //return await FileAttachment("suits.csv").text();
}

function chart () {
  const links = data.links.map(d => Object.create(d));
  const nodes = data.nodes.map(d => Object.create(d));

  const simulation = d3.forceSimulation(nodes)
  .force("link", d3.forceLink(links).id(d => d.id))
  .force("charge", d3.forceManyBody().strength(-400))
  .force("x", d3.forceX())
  .force("y", d3.forceY());

  const svg = d3.create("svg")
  .attr("viewBox", [-width / 2, -height / 2, width, height])
  .style("font", "12px sans-serif");

  //Per-type markers, as they don't inherit styles.
  svg.append("defs").selectAll("marker")
  .data(types)
  .join("marker")
  .attr("id", d => `arrow-${d}`)
  .attr("viewBox", "0 -5 10 10")
  .attr("refX", 15)
  .attr("refY", -0.5)
  .attr("markerWidth", 6)
  .attr("markerHeight", 6)
  .attr("orient", "auto")
  .append("path")
  .attr("fill", color)
  .attr("d", "M0,-5L10,0L0,5");

  const link = svg.append("g")
  .attr("fill", "none")
  .attr("stroke-width", 1.5)
  .selectAll("path")
  .data(links)
  .join("path")
  .attr("stroke", d => color(d.type))
  .attr("marker-end", d => `url(${new URL(`#arrow-${d.type}`, location)})`);

  const node = svg.append("g")
  .attr("fill", "currentColor")
  .attr("stroke-linecap", "round")
  .attr("stroke-linejoin", "round")
  .selectAll("g")
  .data(nodes)
  .join("g")
  .call(drag(simulation));

  node.append("circle")
  .attr("stroke", "white")
  .attr("stroke-width", 1.5)
  .attr("r", 4);

  node.append("text")
  .attr("x", 8)
  .attr("y", "0.31em")
  .text(d => d.id)
  .clone(true).lower()
  .attr("fill", "none")
  .attr("stroke", "white")
  .attr("stroke-width", 3);

  simulation.on("tick", () => {
    link.attr("d", linkArc);
    node.attr("transform", d => `translate(${d.x},${d.y})`);
  });

  invalidation.then(() => simulation.stop());

  return svg.node();
}

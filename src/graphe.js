// https://www.d3indepth.com/force-layout/
// https://observablehq.com/@d3/force-directed-graph

import * as d3 from "d3";
import * as Papa from "papaparse";
import _ from 'lodash';

import './styles.less';

const height = 600;
const width = 600;

function get_data () {
  return new Promise ((resolve, reject) => {
    Papa.parse("https://hub-0-1.github.io/techtree/liens.csv", {
      header: true,
      download: true,
      complete: (results) => { resolve(results.data); }
    });
  });
}

//////////////////
// Main
//////////////////

get_data().then((links) => {

  // Menage dans les donnees undefined
  links = _.filter(links, (l) => { return l.source && l.target });

  // Extraction des donnees pour l'algorithme
  let types = Array.from(new Set(links.map(d => d.type)));
  let data = ({nodes: Array.from(new Set(links.flatMap(l => [l.source, l.target])), id => ({id})), links});
  let color = d3.scaleOrdinal(types, d3.schemeCategory10);

  // Creation de l'objet
  let svg = chart(data, types, color);

  /*d3.select(svg)
      .attr('class', 'chart')
      .attr("viewBox", "0 0 680 490")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .classed("svg-content-responsive", true)
      .call(d3.zoom().on("zoom", function () {
        svg.attr("transform", d3.event.transform)
      }));*/

  // Ajouter 
  document.getElementById("graphe").appendChild(svg);
});

//////////////////

function linkArc (d) {
  const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
  return ` M${d.source.x},${d.source.y} A${r},${r} 0 0,1 ${d.target.x},${d.target.y} `;
}

function drag (simulation) {

  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
}

function chart (data, types, color) {
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

  return svg.node();
}


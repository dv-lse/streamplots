import foo from 'd3'

const factor = 1.5

let rand = d3.randomNormal()

let data = d3.range(100).map( (d) => {
  return { key: d, values: d3.range(250).map(rand) }
})

let margins = { top: 30, right: 30, bottom: 80, left: 30 }

let width = window.innerWidth - margins.left - margins.right
let height = window.innerHeight - margins.top - margins.bottom

let x = d3.scaleLinear()
  .range([0,width])
  .domain(d3.extent(data, (d) => d.key))

let y = d3.scaleLinear()
  .range([height, 0])
  .domain([-5,5])

let svg = d3.select('body').append('svg')
    .attr('width', width + margins.left + margins.right)
    .attr('height', height + margins.top + margins.bottom)
  .append('g')
    .attr('transform', 'translate(' + [ margins.left, margins.top ] + ')')

svg.append('g')
  .attr('class', 'axis y')
  .call(d3.axisLeft()
    .scale(y))

svg.append('g')
  .attr('class', 'axis x')
  .call(d3.axisBottom()
    .scale(x))
  .attr('transform', 'translate(' + [0,height] + ')')

let descriptions = data.map(describe)

let whiskerArea = d3.area()
  .x((d) => x(d.key))
  .y0((d) => y(d.w0))
  .y1((d) => y(d.w1))
  .curve(d3.curveMonotoneX)

let boxArea = d3.area()
  .x((d) => x(d.key))
  .y0((d) => y(d.q1))
  .y1((d) => y(d.q3))
  .curve(d3.curveMonotoneX)

let centerLine = d3.line()
  .x((d) => x(d.key))
  .y((d) => y(d.q2))
  .curve(d3.curveMonotoneX)

svg.append('path')
  .attr('fill', 'orange')
  .attr('stroke', 'none')
  .attr('opacity', 0.3)
  .attr('d', whiskerArea(descriptions))

svg.append('path')
  .attr('fill', 'orange')
  .attr('stroke', 'none')
  .attr('d', boxArea(descriptions))

svg.append('path')
  .attr('fill', 'none')
  .attr('stroke', 'white')
  .attr('stroke-width', 2)
  .attr('d', centerLine(descriptions))

svg.selectAll('outliers')
    .data(descriptions)
  .enter().append('g')
     .attr('class', 'outliers')
     .attr('transform', (d) => 'translate(' + x(d.key) + ')')
   .selectAll('circle')
     .data((d) => d.values.filter( (d0) => d0 < d.w0 || d0 > d.w1))
   .enter().append('circle')
     .attr('fill', 'white')
     .attr('stroke', 'orange')
     .attr('r', 3)
     .attr('cy', y)
     .append('title')
       .text(d3.format('.2f'))

function describe(d) {
  let values = d.values.slice()
  values.sort(d3.ascending)
  let q1 = d3.quantile(values, 0.25)
  let q2 = d3.quantile(values, 0.5)
  let q3 = d3.quantile(values, 0.75)
  let iqr = Math.abs(q3 - q1)
  return {
           w0: q1 - iqr * factor,
           q1: q1,
           q2: q2,
           q3: q3,
           w1: q3 + iqr * factor,
           key: d.key,
           values: values }
}

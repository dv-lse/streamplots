import foo from 'd3'

let rand = d3.randomNormal()

let data = d3.range(20).map( (d) => {
  return { key: d, values: d3.range(250).map(rand) }
})

let margins = { top: 30, right: 30, bottom: 80, left: 80 }

let width = window.innerWidth - margins.left - margins.right
let height = window.innerHeight - margins.top - margins.bottom

let factor = d3.scaleLinear()
  .range([0, 400])
  .domain([0, 2])
  .clamp(true)

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

let axis_y = svg.append('g')
  .attr('class', 'axis y')
  .call(d3.axisLeft()
    .scale(y))

let axis_x = svg.append('g')
  .attr('class', 'axis x')
  .call(d3.axisBottom()
    .scale(x))
  .attr('transform', 'translate(' + [0,height] + ')')

let whisker = svg.append('path')
  .attr('fill', 'orange')
  .attr('stroke', 'none')
  .attr('opacity', 0.3)

let box = svg.append('path')
  .attr('fill', 'orange')
  .attr('stroke', 'none')

let center = svg.append('path')
  .attr('fill', 'none')
  .attr('stroke', 'white')
  .attr('stroke-width', 2)

let outliers = svg.append('g')
  .attr('class', 'outliers')

let slider = svg.append('g')
  .attr('class', 'slider')
  .attr('transform', 'translate(40)')

slider.append('line')
    .attr('class', 'track')
    .attr('x1', factor.range()[0])
    .attr('x2', factor.range()[1])
  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)) })
    .attr('class', 'track-inset')
  .select(function() { return this.parentNode.appendChild(this.cloneNode(true)) })
    .attr('class', 'track-overlay')
    .call(d3.drag()
      .on('start drag', () => {
        let val = factor.invert(d3.event.x)
        slide(val)
      }))

slider.insert('g', '.track-overlay')
    .attr('class', 'ticks')
    .attr('transform', 'translate(0,18)')
  .selectAll('text')
    .data(factor.ticks(10))
   .enter().append('text')
    .attr('x', factor)
    .attr('text-anchor', 'middle')
    .text(d3.format('.2f'))

let handle = slider.insert('circle', '.track-overlay')
  .attr('class', 'handle')
  .attr('r', 9)

slide(1.5)

function slide(val) {
  let agg = describe.bind(null, val)
  update(data.map(agg))
  handle.attr('cx', factor(val))
}

function update(descriptions) {
  whisker.attr('d', whiskerArea(descriptions))
  box.attr('d', boxArea(descriptions))
  center.attr('d', centerLine(descriptions))

  let outlier = outliers.selectAll('.outlier')
      .data(descriptions, (d) => d.key)

  outlier.exit().remove()
  let outlier_enter = outlier.enter().append('g')
    .attr('class', 'outlier')
    .attr('transform', (d) => 'translate(' + x(d.key) + ')')

  let circle = outlier_enter.merge(outlier)
    .selectAll('circle')
       .data((d) => d.values.filter( (d0) => d0 < d.w0 || d0 > d.w1))

  circle.exit().remove()
  let circle_enter = circle.enter().append('circle')
       .attr('fill', 'white')
       .attr('stroke', 'orange')
       .attr('r', 3)
  circle_enter.append('title')
  circle_enter.merge(circle)
    .attr('cy', y)
    .select('title').text(d3.format('.2d'))
}

function describe(factor, d) {
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

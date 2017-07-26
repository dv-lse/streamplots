import '../css/styles.css!'

d3.csv('./uk_tempa_by_year.csv', (err, raw_data) => {

  raw_data.forEach( (d) => { d.year = +d.year; d.temp = +d.temp })

  let data = d3.nest()
    .key((d) => Math.floor(d.year / 10) * 10)
    .sortKeys(d3.ascending)
    .entries(raw_data)

  /////

  let margins = { top: 30, right: 30, bottom: 80, left: 80 }

  let width = window.innerWidth - margins.left - margins.right
  let height = window.innerHeight - margins.top - margins.bottom

  let factor = d3.scaleLinear()
    .range([0, 400])
    .domain([0, 2])
    .clamp(true)

  let x = d3.scaleLinear()
    .range([0,width])
    .domain(d3.extent(raw_data, (d) => d.year))

  let y = d3.scaleLinear()
    .range([height, 0])
    .domain(d3.extent(raw_data, (d) => d.temp))

  let svg = d3.select('body').append('svg')
      .attr('width', width + margins.left + margins.right)
      .attr('height', height + margins.top + margins.bottom)
    .append('g')
      .attr('transform', 'translate(' + [ margins.left, margins.top ] + ')')

  let axis_y = svg.append('g')
    .attr('class', 'axis y')
    .call(d3.axisLeft()
      .scale(y))

  let axis_x = svg.append('g')
    .attr('class', 'axis x')
    .call(d3.axisBottom()
      .scale(x)
      .tickFormat(d3.format('4d')))
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

  let bins = svg.append('g')
    .attr('class', 'bins')

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

    let bandwidth = x(descriptions[1].key) - x(descriptions[0].key)
    let offset = bandwidth / 2

    let whiskerArea = d3.area()
      .x((d) => x(d.key)+offset)
      .y0((d) => y(d.w0))
      .y1((d) => y(d.w1))
      .curve(d3.curveMonotoneX)

    let boxArea = d3.area()
      .x((d) => x(d.key)+offset)
      .y0((d) => y(d.q1))
      .y1((d) => y(d.q3))
      .curve(d3.curveMonotoneX)

    let centerLine = d3.line()
      .x((d) => x(d.key)+offset)
      .y((d) => y(d.q2))
      .curve(d3.curveMonotoneX)

    whisker.attr('d', whiskerArea(descriptions))
    box.attr('d', boxArea(descriptions))
    center.attr('d', centerLine(descriptions))

    let bin = bins.selectAll('.bin')
      .data(descriptions, (d) => d.key)

    bin.exit().remove()
    bin.enter().append('path')
        .attr('class', 'bin')
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
      .merge(bin)
        .attr('d', (d) => 'M' + (x(d.key) + offset) + ' ' + y.range()[0] + 'V' + y.range()[1])

    let outlier = outliers.selectAll('.outlier')
        .data(descriptions, (d) => d.key)

    outlier.exit().remove()
    let outlier_enter = outlier.enter().append('g')
      .attr('class', 'outlier')

    let circle = outlier_enter.merge(outlier)
      .selectAll('circle')
         .data((d) => d.values.filter( (d0) => d0.temp < d.w0 || d0.temp > d.w1))

    let temp_fmt = d3.format('.1f')

    circle.exit().remove()
    let circle_enter = circle.enter().append('circle')
         .attr('fill', 'white')
         .attr('stroke', 'orange')
         .attr('r', 3)
    circle_enter.append('title')
    circle_enter.merge(circle)
      .attr('cx', (d) => x(d.year))
      .attr('cy', (d) => y(d.temp))
      .select('title').text( (d) => temp_fmt(d.temp) + '° c' )
  }

  function describe(factor, d) {
    let values = d.values.map( (d) => d.temp )
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
             values: d.values }
  }
})

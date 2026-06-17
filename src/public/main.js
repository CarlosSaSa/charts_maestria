const api = await fetch('http://localhost:3500/data');
const { data } = await api.json();

// Se crea el chart
let chart;
google.charts.load('current', { 'packages': ['bar'] });
google.charts.setOnLoadCallback( () =>{
    // Se inicia el grafico de forma global al iniciar el script
    chart = new google.charts.Bar(document.getElementById('google_chart'));
    drawChart(data);
});

async function drawChart( data ) {

     /**
     * Se busca formar una estructura de datos de tipo: 
     *  Mes    Producto_1 Producto_2 ... Producto_n
        Enero  100        200        ... 3000
        Febrero 200       200         ... 4000
    */  

    // Se obtienen los datos unicos
    const products = new Set(data.map(item => item.producto)); // Se obtienen los productos unicos 
    const months = new Set(data.map(item => item.mes)); // Se obtienen los meses unicos

    var dataTable = new google.visualization.DataTable();
    // Agrear las columnas 
    dataTable.addColumn('string', 'Mes');
    products.forEach(product => dataTable.addColumn('number', product)) // Cada producto unico se agrega como columna

    for (const month of months) { // Por cada mes unico 
        // De cada mes obtenemos el producto
        const productsSales = []; // Array temporal para almacenar los productos por mes
        for (const product of products) { //Por cada producto unico
            // Del array original de los datos se obtiene el producto unico con su respectivo mes, si se encuentra se obtienen las ventas
            // por ejemplo, Enero - Smartphone A => 200, Enero - Smartphone B => 400
            const productSaleByMonth = data.find(productDB => productDB.mes == month && productDB.producto == product)?.ventas ?? 0;
            productsSales.push(productSaleByMonth); // Se agregan las ventas al array temporal por cada mes actual
        }
        dataTable.addRow([month, ...productsSales]); // Se forma el array por cada mes, por ejemplo, ['Enero', 200, 400, 2000 ] y se agrega al datatable
    }

    let options = {
        chart: {
            title: 'Venta de productos',
        },
        annotations: {
            alwaysOutside: true,
            textStyle: {
                fontSize: 12,
                bold: true
            }
        },
        height: 300,
    };

   chart.draw(dataTable, google.charts.Bar.convertOptions(options));
}




// d3.js
// Configuraciones del container que almacenará el grafico
const margin = { top: 40, right: 40, bottom: 120, left: 80 };
const width = 450 - margin.left - margin.right; // 400px - margenes
const height = 500 - margin.top - margin.bottom; // Altura del container

// Se ponen propieadades del ancho y alto del container
const svg = d3.select("#chartd3")
            .append("svg")
                .attr("width", width + margin.left + margin.right )
                .attr("height", height + margin.top + margin.bottom )
            .append("g")
                .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Contenedores fijos
const gridGroup = svg.append("g").attr("class", "grid");
const xGridGroup = gridGroup.append("g").attr("transform", `translate(0, ${height})`);
const yGridGroup = gridGroup.append("g");

// Definición de los ejes
const axesGroup = svg.append("g").attr("class", "axes");
const xAxisGroup = axesGroup.append("g").attr("class", "axis").attr("transform", `translate(0, ${height})`);
const yAxisGroup = axesGroup.append("g").attr("class", "axis");

// Se añaden las etiquetas de forma estaticaa los ejes
xAxisGroup.append("text")
    .attr("x", width / 2).attr("y", 40).attr("fill", "#1d1d1f")
    .style("font-weight", "500").text("Volumen de Ventas");

yAxisGroup.append("text")
    .attr("transform", "rotate(-90)").attr("x", -height / 2).attr("y", -65).attr("fill", "#1d1d1f")
    .style("font-weight", "500").text("Ingresos Generados");

// Grupo para las leyendas
const legendGroup = svg.append("g").attr("class", "legend-container");

// Tamaño de las escalas de los ejes
const xScale = d3.scaleLinear().range([0, width]);
const yScale = d3.scaleLinear().range([height, 0]);
const rScale = d3.scaleSqrt().range([2, 25]);
const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

// Duración global de las transiciones
const DURATION_UPDATE = 1000;

// Función de renderización del chart
const renderChartD3 = ( data ) => {
    // Se obtienen los productos unicos
    const uniqueProducts = Array.from(new Set(data.map(d => d.producto)));

    // Se actualizan los dominios de escala de los ejes
    xScale.domain([0, d3.max(data, d => d.ventas) * 1.1]);
    yScale.domain([0, d3.max(data, d => d.ingresos) * 1.1]);
    rScale.domain([0, d3.max(data, d => d.precio)]);
    colorScale.domain(uniqueProducts);

    // Se inicia animación entre los ejes y las celdas del grid
    const xAxis = d3.axisBottom(xScale).ticks(8);
    const yAxis = d3.axisLeft(yScale).ticks(8).tickFormat(d => "$" + d.toLocaleString());
    const xGrid = d3.axisBottom(xScale).tickSize(-height).tickFormat("").ticks(8);
    const yGrid = d3.axisLeft(yScale).tickSize(-width).tickFormat("").ticks(8);

    xAxisGroup.transition().duration(DURATION_UPDATE).call(xAxis);
    yAxisGroup.transition().duration(DURATION_UPDATE).call(yAxis);
    xGridGroup.transition().duration(DURATION_UPDATE).call(xGrid);
    yGridGroup.transition().duration(DURATION_UPDATE).call(yGrid);

    // Se forma el binding entre los datos y un id
    const nodes = svg.selectAll(".node")
        .data(data, d => `${d.producto}-${d.mes}`);

    // Se hace el join con los nuevos elementos que aparecen en el chart
    const nodesEnter = nodes.join(
        // Elementos nuevos que nacen en el chart
        enter => {
            const g = enter.append("g")
                .attr("class", "node")
                .style("cursor", "pointer");

            g.append("circle")
                .attr("cx", d => xScale(d.ventas)) // La escala es la venta
                .attr("cy", height) // Se renderizan desde el final
                .attr("r", 0)
                .attr("fill", d => colorScale(d.producto))
                .attr("opacity", 0.75)
                .attr("stroke", "#ffffff")
                .attr("stroke-width", 2);

            g.append("text")
                .attr("x", d => xScale(d.ventas))
                .attr("y", height)
                .attr("opacity", 0)
                .text(d => d.mes)
                .attr("text-anchor", "middle")
                .style("font-size", "11px")
                .style("font-weight", "600")
                .style("fill", "#1d1d1f")
                .style("pointer-events", "none");

            return g;
        },
        // Los elementos que ya existen se mantienen
        update => {
            // Se restaura la opacidad a 1 en cada actualización
            update.attr("opacity", 1);
            
            // Restaurar la opacidad de la burbuja si fueron seleccionados
            update.select("circle")
                .attr("opacity", 0.75)
                .attr("stroke", "#ffffff");

            return update;
        },
        // Los elementos que ya no existen se quitan
        exit => exit.transition()
                    .duration(DURATION_UPDATE / 2)
                    .attr("opacity", 0)
                    .remove()
    );

    // Se animan los elementos, tanto las burbujas como las leyendas
    nodesEnter.select("circle")
        .transition().duration(DURATION_UPDATE)
        .ease(d3.easeCubicOut)
        .attr("cx", d => xScale(d.ventas))
        .attr("cy", d => yScale(d.ingresos))
        .attr("r", d => rScale(d.precio))
        .attr("fill", d => colorScale(d.producto));

    nodesEnter.select("text")
        .transition().duration(DURATION_UPDATE)
        .ease(d3.easeCubicOut)
        .attr("x", d => xScale(d.ventas))
        .attr("y", d => yScale(d.ingresos))
        .attr("dy", d => -(rScale(d.precio) + 6)) // margen de 6 unidades
        .attr("opacity", 1);

    // Por cada elemento renderizado se tiene que asociar el listener
    nodesEnter.on("click", function(event, d) {
        d3.selectAll(".node circle").transition().duration(300).attr("opacity", 0.2); // Elementos diferentes al seleccionado
        d3.select(this).select("circle").transition().duration(300).attr("opacity", 1).attr("stroke", "#1d1d1f"); // Elemento seleccionado

        document.getElementById("detail-product").innerText = d.producto;
        document.getElementById("detail-month").innerText = d.mes;
        document.getElementById("detail-sales").innerText = d.ventas;
        document.getElementById("detail-incomes").innerText = d.ingresos.toLocaleString();
        document.getElementById("detail-prices").innerText = d.precio;
    });

    // Se limmpian las leyendas anteriores
    legendGroup.selectAll("*").remove();

    // Se renderizan los nuevos productos (leyendas)
    let xOffset = 0;
    uniqueProducts.forEach((prod) => {
        const group = legendGroup.append("g").attr("transform", `translate(${xOffset}, 0)`);
        group.append("circle").attr("cx", 6).attr("cy", 6).attr("r", 6).attr("fill", colorScale(prod));
        group.append("text").attr("x", 16).attr("y", 10).text(prod)
            .style("font-size", "12px").style("fill", "#666");

        const textWidth = group.select("text").node().getComputedTextLength();
        xOffset += textWidth + 40;
    });
    const totalLegendWidth = xOffset - 40;
    legendGroup.attr("transform", `translate(${(width - totalLegendWidth) / 2}, ${height + 80})`);

}

// Se renderizan las burbujas con los datos iniciales
renderChartD3( data );

// Botón para actualizar la información
document.querySelector("#updateData").addEventListener('click', async function () {
    const btn = this;
    btn.disabled = true;
    btn.innerText = "Cargando datos..."
    const api = await fetch('http://localhost:3500/data');
    const { data } = await api.json();
    btn.disabled = false;
    renderChartD3( data );
    document.getElementById("detail-product").innerText = "No seleccionado";
    document.getElementById("detail-month").innerText = "No seleccionado";
    document.getElementById("detail-sales").innerText = "No seleccionado";
    document.getElementById("detail-incomes").innerText = "No seleccionado";
    document.getElementById("detail-prices").innerText = "No seleccionado";
    btn.innerText = "Actualizar información"
    d3.selectAll(".node circle").transition().duration(300).attr("opacity", 1);

    drawChart( data )

});
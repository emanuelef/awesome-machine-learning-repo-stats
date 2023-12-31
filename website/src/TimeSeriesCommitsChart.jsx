import React, { useState, useEffect } from "react";
import FusionCharts from "fusioncharts";
import TimeSeries from "fusioncharts/fusioncharts.timeseries";
import ReactFC from "react-fusioncharts";
import CandyTheme from "fusioncharts/themes/fusioncharts.theme.candy";
import schema from "./schemaCommits.js";

ReactFC.fcRoot(FusionCharts, TimeSeries, CandyTheme);
const chart_props = {
  timeseriesDs: {
    type: "timeseries",
    width: "100%",
    height: "80%",
    dataEmptyMessage: "Fetching data...",
    dataSource: {
      caption: { text: "Daily Commits" },
      data: null,
      yAxis: [
        {
          plot: [
            {
              value: "New Commits",
            },
          ],
        },
      ],
      chart: {
        animation: "0",
        theme: "candy",
        exportEnabled: "1",
        exportMode: "client",
        exportFormats: "PNG=Export as PNG|PDF=Export as PDF",
      },
    },
  },
};

const API_URL =
  "https://raw.githubusercontent.com/emanuelef/awesome-machine-learning-repo-stats/main/commits-history-30d.json";

const CSVToArray = (data, delimiter = ",", omitFirstRow = true) =>
  data
    .slice(omitFirstRow ? data.indexOf("\n") + 1 : 0)
    .split("\n")
    .map((v) => {
      let arr = v.split(delimiter);
      arr[1] = parseInt(arr[1]);
      arr[2] = parseInt(arr[2]);
      return arr;
    });

const movingAvg = (array, countBefore, countAfter = 0) => {
  const result = [];
  for (let i = 0; i < array.length; i++) {
    const subArr = array.slice(
      Math.max(i - countBefore, 0),
      Math.min(i + countAfter + 1, array.length)
    );
    const avg =
      subArr.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0) / subArr.length;
    result.push(avg);
  }
  return result;
};

function TimeSeriesCommitsChart({ repo }) {
  const [ds, setds] = useState(chart_props);
  const loadData = async () => {
    try {
      console.log("loadData " + repo);

      const response = await fetch(API_URL);
      const data = await response.json();
      const dataRepo = data[repo];

      let calcMovingAvg = dataRepo.map((el) => {
        return el[1];
      });
      calcMovingAvg = movingAvg(calcMovingAvg, 3, 3);

      const movingAverageData = dataRepo.map((el, index) => {
        el[1] = calcMovingAvg[index];
        return el;
      });

      console.log(movingAverageData);

      const fusionTable = new FusionCharts.DataStore().createDataTable(
        movingAverageData,
        schema
      );
      const options = { ...ds };
      options.timeseriesDs.dataSource.data = fusionTable;
      options.timeseriesDs.dataSource.caption = {
        text: `Daily Commits ${repo}`,
      };
      options.timeseriesDs.dataSource.chart.exportFileName = `${repo.replace(
        "/",
        "_"
      )}-commits-history`;
      setds(options);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    console.log("render");
    loadData();
  }, [repo]);

  return (
    <div
      style={{
        marginLeft: "10px",
        marginTop: "10px",
        marginRight: "10px",
      }}
    >
      <ReactFC {...ds.timeseriesDs} />
    </div>
  );
}

export default TimeSeriesCommitsChart;

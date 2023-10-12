import React from "react";
import { useState, useEffect } from "react";
import { Loading } from "@geist-ui/core";
import { getSummary, postData } from "./utils";

import "./App.css";

function App() {
  const [loading, setLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<any>(null);
  const [waitingForSummary, setWaitingForSummary] = useState<boolean>(false);
  const [objectKey, setObjectKey] = useState<string>("");

  useEffect(() => {
    if (waitingForSummary) {
      const interval = setInterval(async () => {
        let response = await getSummary(objectKey);
        if (response?.status === 200) {
          setSummary(response.data);
          setWaitingForSummary(false);
          setLoading(false);
        }
      }, 1000);

      //Clearing the interval
      return () => clearInterval(interval);
    }
    // Update the document title using the browser API
  }, [waitingForSummary, objectKey]);

  const onUploadClick = async (e: any) => {
    setSummary(null);
    setObjectKey("");

    let files = e.target.files;

    setLoading(true);
    const response = await postData(files);
    console.log(response);
    setObjectKey(response);

    setLoading(false);
    setWaitingForSummary(true);
  };

  return (
    <div className="App">
      <header className="App-header">
        {waitingForSummary ? <p>Waiting for summary to compute</p> : null}
        {loading || waitingForSummary ? (
          <Loading color="green" font="1.5em" />
        ) : (
          <input type="file" id="file" name="file" onChange={onUploadClick} />
        )}
        {summary ? <p>{summary}</p> : null}
      </header>
    </div>
  );
}

export default App;

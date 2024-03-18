import React from "react";
import { useState, useEffect } from "react";
import { Loading, Grid, Card, Text } from "@geist-ui/core";
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
      }, 2500);

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
    console.log("Object uploaded, now polling for summary");
    setObjectKey(response);

    setLoading(false);
    setWaitingForSummary(true);
  };

  const renderVisits = (visits: Array<Object>) => {
    return visits.map((visit: any) => {
      return (
        <Grid xs={12}>
          <Card shadow width="100%">
            <Text h3>Date: {visit.date}</Text>
            <Text h3>Clinic: {visit.clinic}</Text>
            <Text h3>Reason: {visit.reason}</Text>
            <Text h3>Diagnosis: {visit.diagnosis}</Text>
            <Text h3>Treatment: {visit.treatment}</Text>
            <Text h3>Notes: {visit.notes}</Text>
          </Card>
        </Grid>
      );
    });
  };

  const renderSummary = () => {
    if (summary) {
      console.log(summary);
      return (
        <Grid.Container gap={2} justify="center">
          <Grid xs={24}>
            <Text>Name: {summary.animal_name}</Text>
            <Text>Species: {summary.animal_species}</Text>
            <Text>Sex: {summary.animal_sex}</Text>
            <Text>Date of birth: {summary.animal_date_of_birth}</Text>
            <Text>Weight: {summary.animal_weight}</Text>
            <Text>Address: {summary.animal_address}</Text>
            <Text>Owner: {summary.animal_owner}</Text>
            <Text>Address: {summary.animal_address}</Text>
            <Text>Email: {summary.animal_email}</Text>
          </Grid>
          {renderVisits(summary.visits)}
        </Grid.Container>
      );
    } else {
      return null;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        {waitingForSummary ? <p>Summarizing document...</p> : null}
        {loading || waitingForSummary ? (
          <Loading color="green" font="1.5em" />
        ) : (
          <input type="file" id="file" name="file" onChange={onUploadClick} />
        )}
        {renderSummary()}
      </header>
    </div>
  );
}

export default App;

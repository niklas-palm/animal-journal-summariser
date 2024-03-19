import React from "react";
import { useState, useEffect } from "react";
import {
  Loading,
  Grid,
  Card,
  Text,
  Description,
  Spacer,
  Divider,
} from "@geist-ui/core";
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

  const renderAnimalInfo = (summary: any) => {
    return (
      <Grid.Container justify="center">
        <Grid xs={9}>
          <Grid.Container gap={2} justify="center">
            <Grid xs={10}>
              <Description
                title="Animal Name"
                content={summary.animal_name}
                scale={1.5}
              />
            </Grid>
            <Grid xs={10}>
              <Description
                title="Animal Species"
                content={summary.animal_species}
                scale={1.5}
              />
            </Grid>
            <Grid xs={10}>
              <Description
                title="Animal Breed"
                content={summary.animal_breed}
                scale={1.5}
              />
            </Grid>
            <Grid xs={10}>
              <Description
                title="Animal Sex"
                content={summary.animal_sex}
                scale={1.5}
              />
            </Grid>
            <Grid xs={10}>
              <Description
                title="Animal Date of Birth"
                content={summary.animal_date_of_birth}
                scale={1.5}
              />
            </Grid>
            <Grid xs={10}>
              <Description
                title="Animal Weight"
                content={summary.animal_weight}
                scale={1.5}
              />
            </Grid>
          </Grid.Container>
        </Grid>
        <Grid xs={9}>
          <Grid.Container gap={2} justify="center">
            <Grid xs={10}>
              <Description
                title="Owner"
                content={summary.animal_owner}
                scale={1.5}
              />
            </Grid>
            <Grid xs={10}>
              <Description
                title="Address"
                content={summary.animal_address}
                scale={1.5}
              />
            </Grid>
            <Grid xs={10}>
              <Description
                title="Phone"
                content={summary.animal_phone}
                scale={1.5}
              />
            </Grid>
            <Grid xs={10}>
              <Description
                title="Email"
                content={summary.animal_email}
                scale={1.5}
              />
            </Grid>
          </Grid.Container>
        </Grid>
      </Grid.Container>
    );
  };

  const renderVisits = (visits: Array<Object>) => {
    return visits.map((visit: any) => {
      return (
        <Grid xs={10} justify="center">
          {/* <Text type="error"> hejhej</Text> */}
          <Card shadow width="95%">
            <Text p>
              <strong>Date:</strong> {visit.date}
            </Text>
            <Text p>
              <strong>Clinic:</strong> {visit.clinic}
            </Text>
            <Text p>
              <strong>Reason:</strong> {visit.reason}
            </Text>
            <Text p>
              <strong>Diagnosis:</strong> {visit.diagnosis}
            </Text>
            <Text p>
              <strong>Treatment:</strong> {visit.treatment}
            </Text>
            <Text p>
              <strong>Notes:</strong> {visit.notes}
            </Text>
          </Card>
        </Grid>
      );
    });
  };

  const renderSummary = () => {
    if (summary) {
      return (
        <>
          <Spacer />
          <Spacer />

          <Grid.Container direction="column">
            {renderAnimalInfo(summary)}
            <Spacer />
            <Divider h={3} />
            <Spacer />
            <Grid xs={24}>
              <Grid.Container gap={2} justify="center">
                {renderVisits(summary.visits)}{" "}
              </Grid.Container>
            </Grid>
          </Grid.Container>
        </>
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

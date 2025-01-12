import { useState, useEffect } from "react";
import {
  Authenticator,
  Button,
  Text,
  TextField,
  Heading,
  Flex,
  View,
  Image,
  Grid,
  Divider,
  SelectField,
  ScrollView,
} from "@aws-amplify/ui-react";
import { AudioRecorder, useAudioRecorder } from 'react-audio-voice-recorder';
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { getUrl } from "aws-amplify/storage";
import { uploadData, downloadData } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import { Parser } from "html-to-react";

import outputs from "../amplify_outputs.json";
/**
 * @type {import('aws-amplify/data').Client<import('../amplify/data/resource').Schema>}
 */

Amplify.configure(outputs);
const client = generateClient({
  authMode: "userPool",
});

function strip_extension(fname) {
  return fname.replace(/\.[^/.]+$/, "")
}

export default function App() {
  const [notes, setNotes] = useState([]);
  const [partJsonFile, setPartJsonFile] = useState('intro.json');
  const [partJson, setPartJson] = useState({});
  const [excersizeOptions, setExcersizeOptions] = useState([]);
  const [sectionSel, setSectionSel] = useState('');
  const [sectionText, setSectionText] = useState([]);


  async function fetchNotes() {
    const { data: notes } = await client.models.Note.list();
    const partName = strip_extension(partJsonFile)
    await Promise.all(
      notes.map(async (note) => {
        if (note.image) {
          const linkToStorageFile = await getUrl({
            path: ({ identityId }) => `user_media/${identityId}/${partName}/${sectionSel}/${note.image}`,
            expiresIn: 60,
          });
          console.log(linkToStorageFile.url);
          note.image = linkToStorageFile.url;
        }
        return note;
      })
    );
    console.log(notes);
    setNotes(notes);
  }

  useEffect(() => {
    fetchNotes();
  }, [sectionSel]);


  async function createNote(blob) {

    const date_str = (new Date).toISOString()
    const partName = strip_extension(partJsonFile)

    const { data: newNote } = await client.models.Note.create({
      name: partName,
      description: sectionSel,
      image: `${date_str}.webm`,
    });

    console.log(newNote);
    await uploadData({
      path: ({ identityId }) => `user_media/${identityId}/${partName}/${sectionSel}/${newNote.image}`,
      data: blob,
    }).result;

    fetchNotes();
    //event.target.reset();
  }

  async function deleteNote({ id }) {
    const toBeDeletedNote = {
      id: id,
    };

    const { data: deletedNote } = await client.models.Note.delete(
      toBeDeletedNote
    );
    console.log(deletedNote);

    fetchNotes();
  }  


  async function loadJson(filename) {
    try {
      const downloadResult = await downloadData({ 
        path: ({ identityId }) =>`book_json/${filename}`,
      }).result;
      const text = await downloadResult.body.text();
      setPartJson(JSON.parse(text));
      // console.log('Succeed: ', text);
    } catch (error) {
      console.log('Error : ', error);
    }
  }

  useEffect(() => {
    loadJson(partJsonFile);
  },
  [partJsonFile]);


  // parts selection
  const PartsSelectField = () => {
    return <SelectField 
      label="Navigate"
      value={partJsonFile}
      onChange={(e) => setPartJsonFile(e.target.value)}
    >
      <option value="intro.json">Intro</option>
      <option value="part_1.json">Part 1</option>
      <option value="part_2.json">Part 2</option>
      <option value="part_3.json">Part 3</option>
      <option value="part_4.json">Part 4</option>
      <option value="part_5.json">Part 5</option>
      <option value="part_6.json">Part 6</option>
      <option value="part_7.json">Part 7</option>
      <option value="part_8.json">Part 8</option>
      <option value="part_9.json">Part 9</option>
    </SelectField>
  };

  const ExerciseOptions = () => {
    const sections = [];
    for (const key of Object.keys(partJson)) {
      sections.push(<option value={key}>{key}</option>)
    }
    return sections;
  };

  // exercise selection
  useEffect(() => {
    setExcersizeOptions(ExerciseOptions());
  },
  [partJson]);
  
  const ExerciseSelectField = () => {
    return <SelectField 
      label="Exercise"
      value={sectionSel}
      onChange={(e) => setSectionSel(e.target.value)}
      >
        {excersizeOptions}
      </SelectField>
  };

  // default selection
  useEffect(() => {
    if (excersizeOptions.length == 0) {
      return;
    }
    console.log('setting section sel to', excersizeOptions[0]?.props.value)
    setSectionSel(excersizeOptions[0]?.props.value)
  },
  [excersizeOptions]);


  // body of exercise

  const htmlParser = new Parser();

  useEffect(() => {
    const paraArray = partJson[sectionSel];
    if (Array.isArray(paraArray)) {
      // console.log(paraArray.join("\n"));
      setSectionText(
        htmlParser.parse(paraArray.join("\n"))
      );
    } else {
      setSectionText(<p>Select a section</p>);
    }
  },
  [sectionSel]);


  const recorderControls = useAudioRecorder()
  const addAudioElement = (blob) => {
    console.log('addAudioElement');
    console.log(blob);
    // const url = URL.createObjectURL(blob);
    // const audio = document.createElement('audio');
    // audio.src = url;
    // audio.controls = true;
    // document.body.appendChild(audio);
  };

  return (
    <Authenticator>
      {({ signOut }) => (
        <Flex
          className="App"
          justifyContent="center"
          alignItems="center"
          direction="column"
          width="70%"
          margin="0 auto"
        >
          <Heading level={1}>THE SOUND OF FRENCH</Heading>
          <Flex>
            <PartsSelectField />
            <ExerciseSelectField />
          </Flex>
          <ScrollView       backgroundColor="blue.10"  height="300px" className="my-scrollview amplify-text">
            {sectionText}
          </ScrollView>
          <Flex>
            <Text>Record your own voice here:</Text>
            <AudioRecorder 
              audioTrackConstraints={{
                noiseSuppression: true,
                echoCancellation: true,
                // autoGainControl,
                // channelCount,
                // deviceId,
                // groupId,
                // sampleRate,
                // sampleSize,
              }}
              onNotAllowedOrFound={(err) => console.table(err)}
              //downloadOnSavePress={true}
              //downloadFileExtension="webm"
              mediaRecorderOptions={{
                audioBitsPerSecond: 128000,
              }}
              showVisualizer={true}

              onRecordingComplete={(blob) => createNote(blob)}
              recorderControls={recorderControls}
            />
          </Flex>
      
          <Divider />
          <Heading level={2}>Current Notes</Heading>
          <Grid
            margin="3rem 0"
            autoFlow="column"
            justifyContent="center"
            gap="2rem"
            alignContent="center"
          >
            {notes.map((note) => (
              <Flex
                key={note.id || note.name}
                direction="column"
                justifyContent="center"
                alignItems="center"
                gap="2rem"
                border="1px solid #ccc"
                padding="2rem"
                borderRadius="5%"
                className="box"
              >
                <View>
                  <Heading level="3">{note.name}</Heading>
                </View>
                <Text fontStyle="italic">{note.description}</Text>
                <audio controls src={note.image}></audio>
                <Button
                  variation="destructive"
                  onClick={() => deleteNote(note)}
                >
                  Delete note
                </Button>
              </Flex>
            ))}
          </Grid>
          <Button onClick={signOut}>Sign Out</Button>
        </Flex>
      )}
    </Authenticator>
  );
}

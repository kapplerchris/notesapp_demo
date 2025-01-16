import { getUrl } from "aws-amplify/storage";


const audioObjects = {}

async function speak(sound) {
    if (!(sound  in audioObjects)) {
        const urlObj = await getUrl({
            path: ({ identityId }) => `audio_files/${sound}`,
            expiresIn: 60,
          });
            console.log("make audio for",urlObj.url)
            const audio = new Audio(urlObj.url);
            audioObjects[sound] = audio;
            audio.play();
            console.log("played")
        // console.log(linkToStorageFile.url);
        // audioObjects[sound] = new Audio(linkToStorageFile.url);
        // console.log("added sound",sound);
    } else {
        audioObjects[sound].play()
    }
}


export function Spoken(props) {
    return (
        <span  className="sound-click" onClick={async () => speak(props.sound)}>
        {props.children}
        </span>
    );
}
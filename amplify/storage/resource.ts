import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "amplifyNotesDrive-v1",
  access: (allow) => ({
    "user_media/{entity_id}/*": [
      allow.entity("identity").to(["read", "write", "delete"]),
    ],
    'book_audio/*': [
      allow.guest.to(['read']) // additional actions such as "write" and "delete" can be specified depending on your use case
    ],
    'book_json/*': [
      allow.authenticated.to(['read']) // additional actions such as "write" and "delete" can be specified depending on your use case
    ],
  }),
});


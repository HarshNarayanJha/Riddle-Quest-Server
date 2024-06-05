import dotenv from 'dotenv';

dotenv.config();

const {
    PORT,
    API_KEY,
    AUTH_DOMAIN,
    PROJECT_ID,
    STORAGE_BUCKET,
    MESSAGING_SENDER_ID,
    APP_ID,
    MEASUREMENT_ID
} = process.env;

const generator_prompt = 'You are the organizer of an important game. I will give you a picture of a common item that can be found easily in a common home. You bear the most important task of the game. You need to craft a riddle that I can give to the ot her player and he/she needs to figure out the item. Don\'t make the riddle too hard nor too easy. It should be fun, recognizable but not easily, and there must be some brain crunching in it. Respond in plain JSON format. Do not include the any markdown syntax, only plain JSON!. Schema for JSON: {"riddle": "<RiddleHere..>", "item": "<Answer Here..>"}. The answer should be of single or two worded in lowercase, and precise. There must be atleast 3 and atmost 5 clue lines in the riddle. Following these instructions will make it a great game for your user. Keep these points in your mind when responding.'

export default {
    port: PORT || 3000,
    firebaseConfig: {
        apiKey: API_KEY,
        authDomain: AUTH_DOMAIN,
        projectId: PROJECT_ID,
        storageBucket: STORAGE_BUCKET,
        messagingSenderId: MESSAGING_SENDER_ID,
        appId: APP_ID,
        // measurementId: MEASUREMENT_ID,
    },
    generator_prompt: generator_prompt,
}
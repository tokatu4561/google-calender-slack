import { google } from "googleapis"
import { addMinutes, format } from 'date-fns'
import { WebClient } from "@slack/web-api"

const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'

const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID

const SLACK_TOKEN = process.env.SLACK_TOKEN
const SLACK_CHANNEL = process.env.SLACK_CHANNEL

export const handler = async () => {
    // slack
    const slackClient = new WebClient(SLACK_TOKEN)

    const jwtClient = new google.auth.JWT(GOOGLE_CLIENT_EMAIL, undefined, GOOGLE_PRIVATE_KEY, SCOPES)

    const calendar = google.calendar({ version: 'v3', auth: jwtClient})

    // 5分後 までの予定を取得する
    const now = new Date()
    const after5Minute = addMinutes(now, 5)

    const response = await calendar.events.list({
          calendarId: GOOGLE_CALENDAR_ID,
          timeMin: now.toISOString(),
          timeMax: after5Minute.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 10,
    })

    const eventItems = response.data.items
    if (!eventItems || eventItems.length === 0) {
        console.info("nothing event")
        return
    }

    // メッセージ
    const schedules = eventItems.map(async (event) => {
        const slackResponse = await slackClient.chat.postMessage({ 
            channel: SLACK_CHANNEL ?? "", 
            text: '5分前です!',
            attachments: [{
                color: 'good',
                title: event.summary ?? "",
                fields: [
                    {
                        title: '開始時刻',
                        value: `${format(new Date(event.start?.dateTime ?? ""), 'HH:mm')} ~ ${format(new Date(event.end?.dateTime ?? ""), 'HH:mm')} ` 
                    }
                ]
            }]
        });
        console.log(slackResponse)
    })

    await Promise.all(schedules)
};


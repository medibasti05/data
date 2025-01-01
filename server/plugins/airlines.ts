import {defineCronJob} from "../../utils/cron";
import {readFileSync, writeFileSync} from "node:fs";
import {join} from "path";
import {dataDirectory} from "~~/utils";

export default defineNitroPlugin(() => {
    defineCronJob('0 0 * * *', async () => {
        const filePath = join(dataDirectory, 'airlines.json')
        const file = JSON.parse(readFileSync(filePath, 'utf-8'))

        const fileDate = new Date(file.date).getTime()

        if (Date.now() - fileDate < 1000 * 60 * 60 * 24 * 32) return;

        const airlines = await $fetch<{
            records: number
            page: number
            total: number
            rows: {
                icao: string
                airline: string
                callsign: string
                country: string
            }[]
        }>(`https://gng.aero-nav.com/AERONAV/icao_airlines?action=get&oper=grid&_search=false&nd=${Date.now()}&rows=10000&page=1&sidx=icao&sord=asc`)

        writeFileSync(filePath, JSON.stringify({
            date: new Date().toISOString(),
            list: airlines.rows.map(x => ({
                icao: x.icao,
                name: x.airline,
                callsign: x.callsign,
                country: x.country,
                virtual: false,
            }))
        }), 'utf-8')
    })

    defineCronJob('0 0 * * *', async () => {
        const filePath = join(dataDirectory, 'virtual-airlines.json')
        const file = JSON.parse(readFileSync(filePath, 'utf-8'))

        const fileDate = new Date(file.date).getTime()

        if (Date.now() - fileDate < 1000 * 60 * 60 * 24 * 32) return;

        const airlines = await $fetch<{
            records: number
            page: number
            total: number
            rows: {
                icao: string
                airline: string
                callsign: string
                country: string
                rl_exists: string
                in_use: string
            }[]
        }>(`https://gng.aero-nav.com/AERONAV/icao_fhairlines?action=get&oper=grid&_search=false&nd=${Date.now()}&rows=10000&page=1&sidx=icao&sord=asc`)

        writeFileSync(filePath, JSON.stringify({
            date: new Date().toISOString(),
            list: airlines.rows.filter(x => !x.rl_exists).map(x => ({
                icao: x.icao,
                name: x.airline,
                callsign: x.callsign,
                country: x.country,
                virtual: true,
            }))
        }), 'utf-8')
    })
});
import {execSync} from 'child_process'
import path from 'path'
import fs from 'fs'

const {year, month, day, hour, minute, second} = getDateComponents()
const buildDir = `build-prod_${year}-${month}-${day}-${hour}${minute}${second}`
const buildPath = path.join(__dirname, '..', buildDir)

// Create the new timestamped folder
fs.mkdirSync(buildPath)

// Execute the Webpack build
execSync(`webpack build --env production --output-path ${buildPath}`, {stdio: 'inherit'})

// Create the zip archive
execSync(`zip -r archive.zip .`, {cwd: buildPath, stdio: 'inherit'})

console.log(`Production build created in: ${buildPath}`)

function getDateComponents() {
  const date = new Date()
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  const second = date.getSeconds().toString().padStart(2, '0')
  return {year, month, day, hour, minute, second}
}

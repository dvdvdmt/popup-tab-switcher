import * as fs from 'fs'
import * as path from 'path'

const screenshotDirs = [
  path.join(__dirname, '..', 'e2e', 'features', 'settings-view'),
  path.join(__dirname, '..', 'e2e', 'features', 'popup-view'),
]

screenshotDirs.forEach((screenshotDir) => {
  fs.readdir(screenshotDir, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err)
      return
    }

    files.forEach((file) => {
      if (file.endsWith('.current.png')) {
        const baseName = file.replace('.current.png', '')
        const currentPath = path.join(screenshotDir, file)
        const expectedPath = path.join(screenshotDir, `${baseName}.expected.png`)

        console.log(`Updating screenshot: ${expectedPath}`)
        fs.copyFileSync(currentPath, expectedPath)
      }
    })
  })
})

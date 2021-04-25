const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')
const spawn = require('cross-spawn')
const commander = require('commander')

const packageJson = require('./package.json')

let projectName

async function init() {
  const program = new commander.Command(packageJson.name)


  program
    .version(packageJson.version)
    .arguments('<project-directory>')
    .usage(`${chalk.green('<project-directory> [option]')}`)
    .action(name => {
      projectName = name
    })
    .parse(process.argv)

    await createApp(projectName)
}

async function createApp(projectName) {
  const root = path.resolve(projectName)

  fs.ensureDirSync(root)

  console.log(`Creating a new React app in ${chalk.green(root)}`)
  const packageJson = {
    name: projectName,
    version: '0.1.0',
    private: true
  }

  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  )

  const originalDirectory = process.cwd()
  process.chdir(root)

  run(root, projectName, originalDirectory)
}

async function run(root, projectName, originalDirectory) {
  const scriptName = 'react-scripts'
  const templateName = 'cra-template'
  const allDependencies = ['react', 'react-dom', scriptName, templateName]

  console.log(`Installing packages. This might take a couple of minutes.`)
  console.log(`
    Installing ${chalk.cyan('react')}, ${chalk.cyan(
      'react-dom'
    )}, and ${chalk.cyan(scriptName)} with ${chalk.cyan(templateName)}...
  `)

  await install(root, allDependencies)

  const data = [root, projectName, true, originalDirectory, templateName]
  const source = `
      var init = require('react-scripts/scripts/init.js');
      init.apply(null, JSON.parse(process.argv[1]));
  `

  await executeNodeScript({ cwd: process.cwd() }, data, source)

  console.log(chalk.green('Done...'))
}

async function install(root, allDependencies) {
  return new Promise(resolve => {
    const command = 'yarnpkg'
    const args = [
      'add',
      '--exact',
      ...allDependencies,
      '--cwd',
      root
    ]

    console.log(command, args)

    const child = spawn(command, args, {
      stdio: 'inherit'
    })

    child.on('close', resolve)
  })
}

async function executeNodeScript({ cwd }, data, source) {
  return new Promise(resolve => {

    console.log('template......')
    const child = spawn(
      process.execPath,
      ['-e', source, '--', JSON.stringify(data)],
      { cwd, stdio: 'inherit' }
    )

    child.on('close', resolve)
  })
}

module.exports = {
  init
}
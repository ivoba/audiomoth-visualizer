# Audiomoth Visualizer

Node.js pipeline for spectrograms creation and [Birdnet](https://github.com/kahst/BirdNET) detection for your [Audiomoth](https://www.openacousticdevices.info/audiomoth) sessions.  
It will create a movie per audiofile with a spectrogram as image and utilizes birdnet AI to detect bird species.  
The HTML page lists all movies and renders the birdnet detections.

![](audiomoth-visualizer.png)

## Installation

You will need `docker`,`sox` and `ffmpeg` on your machine.  
On Linux install it like this:

    sudo apt install sox ffmpeg

For docker installation see here: https://docs.docker.com/engine/install/.  
Birdnet detection software will run inside a docker container.

Clone this repository:

    git clone git@github.com:ivoba/audiomoth-visualizer.git

Install dependencies:

    npm i

## Usage

    node_modules/.bin/zx index.mjs <path-to/my-audiomoth-session> <destination-dir> --title="Session title" --locale=de-DE --timezone=Europe/Berlin

Then open the generated `files/my-audiomoth-session/index.html` in your favorite Browser by doubleclick or via console:

    chromium <path-to/my-audiomoth-session>/index.html

## Development

There are entrypoints to test birdnet AI or HTML generation separately:

HTML generation:

    node_modules/.bin/zx html.mjs <path-to/my-audiomoth-session>

Birdnet detection:

    node_modules/.bin/zx birdnet.mjs <path-to/my-audiomoth-session>

## Credits

Heavily inspired by:  
https://github.com/nwolek/audiomoth-scripts

## Todo

- responsive images
- responsive video
- github actions CI
- changelog
- release-it
- upload to npm
- use npx
  Running on-demand:
  npx audiomoth-visualizer <path-to/my-audiomoth-session>
  Using npx you can run the script without installing it first
  Globally via npm
  npm install --global
- tests
- move audiofiles to audio dir? maybe as option
  source & dest

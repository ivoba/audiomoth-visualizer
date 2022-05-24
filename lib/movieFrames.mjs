const createMovieFrames = async (
  dest,
  file,
  baseFileName,
  totalDuration,
  thumbMaxDuration,
  title,
  date,
  thumb
) => {
  let imageCount = 0;
  for (let i = 0; i < totalDuration; i = i + thumbMaxDuration) {
    let frameImage = `${dest}/tmp_${baseFileName}${imageCount}.png`;
    console.log(
      `making spectrogram from ${i} to ${i + thumbMaxDuration} seconds...`
    );
    // generate the initial .png spectrogram output from sox
    let annotation = `${title}\n ${date.mtime.toISOString()}`;
    await $`sox ${file} -n rate 24k trim 0 10 spectrogram -x 1136 -y 642 -z 96 -w hann -o -`
      //extend image with black background & add text to bottom of image
      .pipe(
        $`convert PNG:- -background black -gravity north -extent 1280x820 - | convert PNG:- -gravity south -fill white -pointsize 36 -annotate +0+10 ${annotation} ${frameImage}`
      );
    imageCount++;
  }
  const firstFrame = `${dest}/tmp_${baseFileName}0.png`;
  await $`convert ${firstFrame} -resize 300x170 ${thumb}`;
};

export { createMovieFrames };

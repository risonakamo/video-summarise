const {getVideoDurationInSeconds}=require("get-video-duration")
const extractFrames=require("ffmpeg-extract-frames");
const logUpdate=require("log-update");
const _=require("lodash");

_initialRange=[0,10]; //initial time stamp starting range
_randomRange=[3,10]; //time stamp increment random range
_imageBatch=10; // ffmpeg extract process number

async function main()
{
    var {totalTimestamps,timestamps}=await generateChunkTimestamps("azur2.mkv",_initialRange,_randomRange,_imageBatch);

    console.log("total timestamps:",totalTimestamps);

    for (var x=0;x<timestamps.length;x++)
    {
        await doExtract("azur2.mkv",timestamps[x]);
        logUpdate(`${x+1}/${timestamps.length}`);
    }
}

// given a string path to a video file, return an array of randomised timestamps throughout
// the video, seperated into chunks of a minimum size. async, so needs to be awaited
/* string videofile: string path to the target video
   int[2] initialRange: random range where timestamp can begin at
   int[2] randomRange: random range of increments between each random time stamp
   int batchSize: size of chunks in output

   output of function is an array of arrays of time stamps, with each smaller array having a maximum
   size as set by the batchSize parameter, and also the total number of timestamps without the chunking*/
async function generateChunkTimestamps(videofile,initialRange=[0,10],randomRange=[3,10],batchSize=5)
{
    var duration=Math.floor(await getVideoDurationInSeconds(videofile));

    var current=_.random(initialRange[0],initialRange[1]);
    var timestamps=[current];
    while (1)
    {
        current+=_.random(randomRange[0],randomRange[1]);

        if (current>=duration)
        {
            break;
        }

        timestamps.push(current);
    }

    return {
        totalTimestamps:timestamps.length,
        timestamps:_.chunk(timestamps,batchSize)
    };
}

/* does the extracting, returns a promise that finishes when all extractions are complete.
   string videofile: string path to target video
   int array timestamps: array of second timestamps to extract

   screenshots are named with the timestamp*/
function doExtract(videofile,timestamps)
{
    var extractPromises=_.map(timestamps,(x,i)=>{
        return extractFrames({
            input:videofile,
            output:`frames/screenshot-${x}.png`,
            timestamps:[x]
        });
    });

    return Promise.all(extractPromises);
}

main();
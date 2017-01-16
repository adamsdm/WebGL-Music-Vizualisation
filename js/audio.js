
function AudioHandler() {
    this.canvas = document.querySelector('.visualizer');
    this.WIDTH = this.canvas.width;
    this.HEIGHT = this.canvas.height;
    this.canvasCtx = this.canvas.getContext("2d");
    this.lfAmplitude; 
    this.hfAmplitude;
    
    this.audioCtx;
    this.audio;
    this.analyser;
    this.audioSrc;
}

AudioHandler.prototype.init = function() {

    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();;

    //set up the different audio nodes we will use for the app
    this.audio = document.getElementById('myAudio');
    this.analyser = this.audioCtx.createAnalyser();


    // we have to connect the MediaElementSource with the analyser 
    this.audioSrc = this.audioCtx.createMediaElementSource(this.audio);
    this.audioSrc.connect(this.analyser);
    this.audioSrc.connect(this.audioCtx.destination);

    // Process
    this.analyser.fftSize = 128;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);

    this.canvasCtx.clearRect(0, 0, this.WIDTH, this.HEIGHT);

}



AudioHandler.prototype.update = function() {
        this.analyser.getByteFrequencyData(this.dataArray);

        this.canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        this.canvasCtx.fillRect(0, 0, this.WIDTH, this.HEIGHT);

        
        this.barWidth = this.WIDTH /  this.bufferLength;
        this.barHeight;
        

        this.lfAmplitude = 0;
        this.hfAmplitude = 0;

        
        
        for (var i = 0; i < this.dataArray.length / 2; i++) {
                this.hfAmplitude += this.dataArray[i];
        }
        for (var i = this.dataArray.length / 2; i < this.dataArray.length; i++) {
                this.lfAmplitude += this.dataArray[i];
        }
        
        this.lfAmplitude *= 0.020;
        this.hfAmplitude *= 0.002;
};

AudioHandler.prototype.draw = function() {
    this.barHeight = 0;
    this.x = 0;

    this.canvasCtx.clearRect(0,0,this.WIDTH,this.HEIGHT);
    for (var i = 0; i < this.bufferLength; i++) {
        this.barHeight = this.dataArray[i];
        this.canvasCtx.fillStyle = 'rgb(' + (this.barHeight + 100) + ',50,50)';

        this.canvasCtx.fillRect(this.x, this.HEIGHT - this.barHeight / 2, this.barWidth, this.barHeight / 2);

        this.x += this.barWidth + 1;
    }
};

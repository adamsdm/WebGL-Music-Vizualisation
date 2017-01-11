

    var canvas = document.querySelector('.visualizer');


    var canvasCtx = canvas.getContext("2d");
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    var bassAmplitude;
    var uniforms = {};

    window.onload = function() {

        
        var audioCtx = new (window.AudioContext || window.webkitAudioContext)();;

        //set up the different audio nodes we will use for the app
        var audio = document.getElementById('myAudio');
        var analyser = audioCtx.createAnalyser();

        // we have to connect the MediaElementSource with the analyser 
        var audioSrc = audioCtx.createMediaElementSource(audio);
        audioSrc.connect(analyser);
        audioSrc.connect(audioCtx.destination);

        console.log(audioSrc);


     // Process
        analyser.fftSize = 128;
        var bufferLength = analyser.frequencyBinCount;
        console.log(bufferLength);
        var dataArray = new Uint8Array(bufferLength);

        console.log(dataArray);

        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

        function draw() {
            requestAnimationFrame(draw);

            analyser.getByteFrequencyData(dataArray);

            canvasCtx.fillStyle = 'rgb(0, 0, 0)';
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

            var barWidth = (WIDTH / bufferLength) ;
            var barHeight;
            var x = 0;
            
            var bufferSample = bufferLength-17;
            bassAmplitude = dataArray[bufferSample]; 


            uniforms.amp.value = bassAmplitude;

            for(var i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i];
                canvasCtx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';

                if(i==bufferSample)
                    canvasCtx.fillStyle = 'rgb(0,255,0)';


                canvasCtx.fillRect(x,HEIGHT-barHeight/2,barWidth,barHeight/2);

                x += barWidth + 1;
            }


        };


    audio.play();
    draw();
   

    };









    //*****************//
    // ****THREE JS ***//
    //*****************//
    var stats, scene, renderer, composer;
    var camera, cameraControls;

    var time;
    var startTime = new Date().getTime();

    



    if (!init()) animate();

    // init the scene
    function init() {

        initScene();
        addLights();
        addObjects();

        time = 0;

        /*
        // postprocessing
        // https://github.com/mrdoob/three.js/blob/master/examples/webgl_postprocessing.html
        composer = new THREE.EffectComposer( renderer );
        composer.addPass( new THREE.RenderPass( scene, camera ) );
        var effect = new THREE.ShaderPass( THREE.DotScreenShader );
        effect.uniforms[ 'scale' ].value = 4;
        composer.addPass( effect );
        var effect = new THREE.ShaderPass( THREE.RGBShiftShader );
        effect.uniforms[ 'amount' ].value = 0.0015;
        effect.renderToScreen = true;
        composer.addPass( effect );
        */
    }


    function addObjects() {

        const GROUND_DIM = 1000;
        const GROUND_SQUARES = 100;

        var geometry = new THREE.PlaneGeometry(GROUND_DIM, GROUND_DIM, GROUND_SQUARES, GROUND_SQUARES);


        uniforms.lightPos = {type: 'v3',    value: light.position};
        uniforms.time = {type: 'v3',        value: 1.0};
        uniforms.amp = {type: 'f',          value:0.0}

        
        var groundMaterial = new THREE.ShaderMaterial( {
                    uniforms: uniforms,
                    vertexShader: document.getElementById( 'vertexShader' ).textContent,
                    fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
                    wireframe: true,
                    derivatives: true
            } );
        

        
        planeMesh = new THREE.Mesh(geometry, groundMaterial);

        planeMesh.position.y = -1.9
        planeMesh.rotation.x = -Math.PI / 2;

        scene.add(planeMesh);
        


        var sunMaterial = new THREE.MeshBasicMaterial();

        var sun = new THREE.Mesh(
          new THREE.SphereGeometry(10,32,32), sunMaterial);
        

        sun.position.set(light.position.x,light.position.y, light.position.z ); //Set position the same as the light position
        scene.add(sun);






    }



    function initScene() {
        if (Detector.webgl) {
            renderer = new THREE.WebGLRenderer({
                antialias: true, // to get smoother output
                preserveDrawingBuffer: true // to allow screenshot
            });
            renderer.setClearColor(0,0,0,0);
        } else {
            renderer = new THREE.CanvasRenderer();
        }

        renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('container').appendChild(renderer.domElement);


        // create a scene
        scene = new THREE.Scene();

        // put a camera in the scene
        camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.set(0, 50, 300);


        scene.add(camera);

        // create a camera contol
        cameraControls = new THREE.TrackballControls(camera)

        // transparently support window resize
        THREEx.WindowResize.bind(renderer, camera);
        // allow 'p' to make screenshot
        THREEx.Screenshot.bindKey(renderer);
        // allow 'f' to go fullscreen where this feature is supported
        if (THREEx.FullScreen.available()) {
            THREEx.FullScreen.bindKey();
            document.getElementById('inlineDoc').innerHTML += "- <i>f</i> for fullscreen";
        }
    }

    function addLights() {
        // here you add your objects
        // - you will most likely replace this part by your own

        light = new THREE.DirectionalLight(0xffffff);
        light.position.set(1000, 100, 100);
        scene.add(light);

    }



    // animation loop
    function animate() {

        // loop on request animation loop
        // - it has to be at the begining of the function
        // - see details at http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
        requestAnimationFrame(animate);

        // do the render
        render();

    }

    // render the scene
    function render() {
        // variable which is increase by Math.PI every seconds - usefull for animation
        time = (new Date().getTime() - startTime)/1000;

        // update camera controls
        //cameraControls.update();
        //console.log(bassAmplitude);

        uniforms.time.value = time;

        // animate PointLights
        scene.traverse(function(object3d, idx) {
            if (object3d instanceof THREE.PointLight === false) return
            var angle = 0.0005 * PIseconds * (idx % 2 ? 1 : -1) + idx * Math.PI / 3;
            object3d.position.set(Math.cos(angle) * 3, Math.sin(angle * 3) * 2, Math.cos(angle * 2)).normalize().multiplyScalar(2);
        })

        // actually render the scene
        renderer.render(scene, camera);
    }
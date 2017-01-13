    var canvas = document.querySelector('.visualizer');



    var canvasCtx = canvas.getContext("2d");
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    var lfAmplitude;
    var uniforms = {};

    window.onload = function() {

        
        var audioCtx = new (window.AudioContext || window.webkitAudioContext)();;

        //set up the different audio nodes we will use for the app
        var audio = document.getElementById('myAudio');
        var analyser = audioCtx.createAnalyser();


        console.log(audio.src);

        // we have to connect the MediaElementSource with the analyser 
        var audioSrc = audioCtx.createMediaElementSource(audio);
        audioSrc.connect(analyser);
        audioSrc.connect(audioCtx.destination);


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
            
            //Sums all elements in dataArray
            //lfAmplitude = dataArray.reduce((pv, cv) => pv+cv*1.2, 0)*0.02;

            //Only sums 2nd half elements, or the low frequencies
            lfAmplitude = 0;
            for(var i=dataArray.length/2; i<dataArray.length; i++){
                lfAmplitude += dataArray[i];
            }

            lfAmplitude*=0.08;



            uniforms.amp.value = lfAmplitude;


            // Draw freq
            for(var i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i];
                canvasCtx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';

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
    var pyramidMesh;

    var time;
    var startTime = new Date().getTime();



    if (!init()) animate();

    // init the scene
    function init() {

        initScene();
        postprocessing();
        addLights();
        addObjects();



        time = 0;
    }


    function addObjects() {

        // Ground
        const GROUND_DIM = 1000;
        const GROUND_SQUARES = 100;

        var geometry = new THREE.PlaneGeometry(GROUND_DIM, GROUND_DIM, GROUND_SQUARES, GROUND_SQUARES);


        uniforms.lightPos = {type: 'v3',    value: light.position};
        uniforms.time = {type: 'v3',        value: 1.0};
        uniforms.amp = {type: 'f',          value:0.0}

        // Create two uniform arrays to get different colors on two materials, ugly but works         
        WFUniforms = {};
        NoWFUniforms = {};

        WFUniforms = Object.assign({}, uniforms, 
            {
                color1:     {type: 'v3',    value: [0.3, 0.4, 1.0] },
                color2:     {type: 'v3',    value: [1.0, 0.0, 1.0] },
            }
        );

        NoWFUniforms = Object.assign({}, uniforms, 
            {
                color1:     {type: 'v3',    value: [0.0, 0.0, 0.0] }, 
                color2:     {type: 'v3',    value: [0.0, 0.0, 0.0] }, 
            }
        );

        var groundMaterialWF = new THREE.ShaderMaterial( {
                    uniforms: WFUniforms,
                    vertexShader: document.getElementById( 'vertexShader' ).textContent,
                    fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
                    wireframe: true,
                    derivatives: true
            } );
        var groundMaterial = new THREE.ShaderMaterial( {
                    uniforms: NoWFUniforms,
                    vertexShader: document.getElementById( 'vertexShader' ).textContent,
                    fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
                    derivatives: true
            } );
        
        // TEMP
        var planeMesh = THREE.SceneUtils.createMultiMaterialObject( geometry, [
            groundMaterialWF,
            groundMaterial
        ]);


        planeMesh.position.y = -60 //-1.9
        planeMesh.rotation.x = -Math.PI / 2;

        scene.add(planeMesh);
        


        // Background pyramid
        var pyramidGeometry = new THREE.Geometry();

        pyramidGeometry.vertices = [
            new THREE.Vector3(  1, 0, -1 ),
            new THREE.Vector3( -1, 0, -1 ),
            new THREE.Vector3( -1, 0, 1 ),
            new THREE.Vector3( 1, 0, 1 ),
            new THREE.Vector3( 0, 2, 0 )
        ];

        pyramidGeometry.faces = [
            new THREE.Face3( 0, 1, 2 ),
            new THREE.Face3( 0, 2, 3 ),
            new THREE.Face3( 1, 0, 4 ),
            new THREE.Face3( 2, 1, 4 ),
            new THREE.Face3( 3, 2, 4 ),
            new THREE.Face3( 0, 3, 4 )
        ];  
        
        var pyramidMaterial = new THREE.MeshBasicMaterial( { wireframe: true, color: '#FF00FF' } );
        pyramidMesh = new THREE.Mesh( pyramidGeometry, pyramidMaterial );
        scene.add( pyramidMesh );

        pyramidMesh.scale.set(100,100,100);
        pyramidMesh.position.set(0, -60, -1*GROUND_DIM-140);


        //Background stars



    }



    function initScene() {
        
        if (Detector.webgl) {
            renderer = new THREE.WebGLRenderer({
                antialias: true, // to get smoother output
                preserveDrawingBuffer: true, // to allow screenshot
                alpha: true //To allow for background
            });
            renderer.setClearColor(0,0,0,0);
        } else {
            renderer = new THREE.CanvasRenderer({ alpha: true });
        }

        renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('container').appendChild(renderer.domElement);


        // create a scene
        scene = new THREE.Scene();

        // put a camera in the scene
        camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.set(0, 0, 800);

    }

    function postprocessing(){
        // Postprocessing
        composer = new THREE.EffectComposer( renderer );
        composer.addPass( new THREE.RenderPass( scene, camera ) );


        // Film effect
        var noiseIntensity = 1.0;
        var scanlinesIntensity = 1.0;
        var scanlinesCount = 1024;
        var grayscale = false;

        var effectFilmBW = new THREE.FilmPass( noiseIntensity, scanlinesIntensity, scanlinesCount, grayscale );
        //composer.addPass(effectFilmBW);


        // RGB shift
        var effect = new THREE.ShaderPass( THREE.RGBShiftShader );
        effect.uniforms[ 'amount' ].value = 0.0015;
        effect.renderToScreen = true;
        composer.addPass( effect );

        // create a camera contol
        cameraControls = new THREE.TrackballControls(camera)

        // transparently support window resize
        THREEx.WindowResize.bind(renderer, camera);
    

    }

    function addLights() {
        // here you add your objects
        // - you will most likely replace this part by your own

        light = new THREE.DirectionalLight(0xffffff);
        light.position.set(1000, 100, 100);
        scene.add(light);

    }

    function updateObjects(){
        // Pyramid
        pyramidMesh.rotation.y += 0.0002*uniforms.amp.value;
        pyramidMesh.scale.y = 100 + 0.1*uniforms.amp.value;

        //Song title
        var shadowDisp = -0.0005*uniforms.amp.value;
        document.getElementById("songTitle").style.textShadow = String(shadowDisp)+"em "+ String(-shadowDisp) +"em 0em #FF00FF";
    }



    // animation loop
    function animate() {

        // loop on request animation loop
        // - it has to be at the begining of the function
        // - see details at http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
        requestAnimationFrame(animate);

        updateObjects();

        // do the render
        render();
        

    }

    // render the scene
    function render() {
        // variable which is increase by Math.PI every seconds - usefull for animation
        time = (new Date().getTime() - startTime)/1000;

        // update camera controls
        cameraControls.update();
        
        // Update uniforms
        uniforms.time.value = time;

        // animate PointLights
        scene.traverse(function(object3d, idx) {
            if (object3d instanceof THREE.PointLight === false) return
            var angle = 0.0005 * PIseconds * (idx % 2 ? 1 : -1) + idx * Math.PI / 3;
            object3d.position.set(Math.cos(angle) * 3, Math.sin(angle * 3) * 2, Math.cos(angle * 2)).normalize().multiplyScalar(2);
        })

        // actually render the scene
        composer.render();

    }

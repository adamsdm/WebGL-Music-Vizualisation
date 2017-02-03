require('clubber');
var $ = require('jquery');

var uniforms = {};
uniforms.lfAmp = {};
uniforms.hfAmp = {};
var AudioController;
const CLIENT_ID = 'fay591MRwutHZh1CYuqToQK0LcO1Saxg';

//*****************//
//***** AUDIO *****//
//*****************//


window.onload = function () {

    var audio = new Audio();
    setSong('https://soundcloud.com/ghostly/com-truise-84-dreamin'); // Set src of audio element to soundcloud stream url

    audio.controls = true;
    audio.autoplay = false;
    audio.crossOrigin = "anonymous";
    document.getElementById('inlineDoc').appendChild(audio);



    var context = new (window.AudioContext || window.webkitAudioContext)();


    window.addEventListener('load', function(e) {
      var source = context.createMediaElementSource(audio);
      source.connect(context.destination);
    }, false);



    var clubber = new Clubber({
        size: 2048, // Samples for the fourier transform. The produced linear frequency bins will be 1/2 that.
        mute: false // whether the audio source should be connected to web audio context destination.
    });

    clubber.listen( audio );

    update();


    function update() {
        requestAnimationFrame(update);
        clubber.update();

        uniforms.lfAmp.value = 0;
        uniforms.hfAmp.value = 0;

        for(var i=0; i<clubber.notes.length/2; i++){
            uniforms.hfAmp.value += clubber.notes[i];
        }
        for(var i=clubber.notes.length/2; i<clubber.notes.length; i++){
            uniforms.lfAmp.value += clubber.notes[i];
        }

        // Calculate avarage value of lower/upper frequencies and multiply amplitude
        uniforms.lfAmp.value = 0.5 * uniforms.lfAmp.value/ (clubber.notes.length / 2);
        uniforms.hfAmp.value = 20 * uniforms.lfAmp.value/ (clubber.notes.length / 2);


    }



    // source: https://goo.gl/pV0Aam common.js, #160
    function setSong(url) {
      load("//api.soundcloud.com/resolve?url=" + encodeURIComponent(url.split("?")[0]) + "&client_id=" + CLIENT_ID).then(function (text) {
        var data = JSON.parse(text);

        if (data.kind !== "track"){
          alert( "Please provide a track url, " + data.kind + " urls are not supported.");
          return;

        }
        var streamUrl = 'http://api.soundcloud.com/tracks/'+data.id+'/stream?client_id='+CLIENT_ID;
        audio.src = streamUrl;
        audio.load();

        $('#title').text(data.title);
        $('#artist').text(data.user.username);
        $('#roll-text > span').text('Now listening to: '+ data.title + " by " + data.user.username);
        $('#song-marquee > a').attr('href', data.permalink_url);

      }, function () {
        alert(url + " is not a valid soundcloud track url.")
      })
    }
    function load (url, cb) {
      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.onload = function () {
          if (this.status >= 200 && this.status < 300) {
            resolve(xhr.response);
          } else {
            reject({
              status: this.status,
              statusText: xhr.statusText
            });
          }
          if(cb) {
            cb(this.status);
          }
        };
        xhr.onerror = function () {
          reject({
            status: this.status,
            statusText: xhr.statusText
          });
        };
        xhr.send();
      });
    }





    //*****************//
    //***** INFO ******//
    //*****************//
    // locate your element and add the Click Event Listener
    document.getElementById("song-dropdown").addEventListener("click",function(e) {
        if(e.target && e.target.nodeName == "A") {
            if(e.target.dataset.url == 'addSong'){
                var input = prompt("Please enter soundcloud track url");
                if(input) setSong(input);
            } else {
                setSong(e.target.dataset.url);
            }
        }
    });
};




//*****************//
//*** THREE JS ****//
//*****************//

var stats, scene, renderer, composer, light;
var camera, cameraControls;
var pyramidMesh, planetMaterial, particles, planetGeometry, bgMaterial;
var stars = [];

var time;
var startTime = new Date().getTime();

var PYRAMID_SCALE = 200;



// init the scene
if (!init()) animate();

window.addEventListener( 'resize', onWindowResize, false );

function init() {

        initScene();
        postprocessing();
        addLights();
        addObjects();

        time = 0;

}
function initScene() {

        if (Detector.webgl) {
                renderer = new THREE.WebGLRenderer({
                        antialias: true, // to get smoother output
                        preserveDrawingBuffer: true, // to allow screenshot
                        alpha: true //To allow for background
                });
                renderer.setClearColor(0, 0, 0, 0);
        } else {
                renderer = new THREE.CanvasRenderer({ alpha: true });
        }

        renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('container').appendChild(renderer.domElement);

        // create a scene
        scene = new THREE.Scene();

        // put a camera in the scene
        camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = 1200;
}

function postprocessing() {
        // Postprocessing
        composer = new THREE.EffectComposer(renderer);
        composer.addPass(new THREE.RenderPass(scene, camera));

        // Film effect
        var noiseIntensity = 1.0;
        var scanlinesIntensity = 0.7;
        var scanlinesCount = 4;
        var grayscale = false;

        var effectFilmLF = new THREE.FilmPass(noiseIntensity, scanlinesIntensity, scanlinesCount, grayscale);
        var effectFilmHF = new THREE.FilmPass(0.9, scanlinesIntensity, 1024, grayscale);

        // RGB shift
        var colorShiftEffect = new THREE.ShaderPass(THREE.RGBShiftShader);
        colorShiftEffect.uniforms['amount'].value = 0.0015;
        colorShiftEffect.renderToScreen = true;

        // Add effects
        //omposer.addPass(effectFilmLF);
        composer.addPass(effectFilmHF);
        composer.addPass(colorShiftEffect);

        // create a camera contol
        cameraControls = new THREE.TrackballControls(camera);

        // transparently support window resize
        THREEx.WindowResize.bind(renderer, camera);
}

function addLights() {

        light = new THREE.DirectionalLight(0xffffff);
        light.position.set(1000, 100, 100);
        //light.position.set(0, 100, 600);
        scene.add(light);
}

function addObjects() {

        // Ground
        var GROUND_DIM = 4000;
        var GROUND_SQUARES = 100;

        var groundGeometry = new THREE.PlaneGeometry(GROUND_DIM, GROUND_DIM, GROUND_SQUARES, GROUND_SQUARES);

        uniforms.lightPos = { type: 'v3', value: light.position };
        uniforms.time = { type: 'v3', value: 1.0 };
        uniforms.lfAmp = { type: 'f', value: 0.0 };
        uniforms.hfAmp = { type: 'f', value: 0.0 };

        // Create two uniform arrays to get different colors on two materials, ugly but works
        var WFUniforms = {};
        var NoWFUniforms = {};

        WFUniforms = Object.assign({}, uniforms, {
                color1: { type: 'v3', value: [0.3, 0.4, 1.0] },
                color2: { type: 'v3', value: [1.0, 0.0, 1.0] }
        });

        NoWFUniforms = Object.assign({}, uniforms, {
                color1: { type: 'v3', value: [0.08, 0.13, 0.17] },
                color2: { type: 'v3', value: [0.08, 0.13, 0.17] }
        });

        var groundMaterialWF = new THREE.ShaderMaterial({
                uniforms: WFUniforms,
                vertexShader: document.getElementById('vertexShader').textContent,
                fragmentShader: document.getElementById('fragmentShader').textContent,
                wireframe: true

        });
        var groundMaterial = new THREE.ShaderMaterial({
                uniforms: NoWFUniforms,
                vertexShader: document.getElementById('vertexShader').textContent,
                fragmentShader: document.getElementById('fragmentShader').textContent
        });

        groundMaterialWF.extensions.derivatives = true
        groundMaterial.extensions.derivatives = true

        // TEMP
        var planeMesh = THREE.SceneUtils.createMultiMaterialObject(groundGeometry, [groundMaterialWF, groundMaterial]);

        planeMesh.position.y = -60; //-1.9
        planeMesh.rotation.x = -Math.PI / 2;

        scene.add(planeMesh);

        // Background pyramid
        var pyramidGeometry = new THREE.Geometry();

        pyramidGeometry.vertices = [new THREE.Vector3(1, 0, -1), new THREE.Vector3(-1, 0, -1), new THREE.Vector3(-1, 0, 1), new THREE.Vector3(1, 0, 1), new THREE.Vector3(0, 2, 0)];
        pyramidGeometry.faces = [new THREE.Face3(1, 0, 4), new THREE.Face3(2, 1, 4), new THREE.Face3(3, 2, 4), new THREE.Face3(0, 3, 4)];


        // Pyramid
        var geo = new THREE.EdgesGeometry(pyramidGeometry);
        var mat = new THREE.LineBasicMaterial({ color: 0xFF00FF, linewidth: 2 });
        pyramidMesh = new THREE.LineSegments(geo, mat);

        scene.add(pyramidMesh);

        pyramidMesh.scale.set(PYRAMID_SCALE, PYRAMID_SCALE, PYRAMID_SCALE);
        pyramidMesh.position.set(0, -60, -1 * GROUND_DIM / 2);
        pyramidMesh.position.z -= Math.sqrt(2 * Math.pow(PYRAMID_SCALE, 2));



        //Background stars
        var sprite = new THREE.TextureLoader().load( "images/ball.png" );
        var sc = Math.max(window.innerWidth, window.innerHeight);

        planetGeometry = new THREE.Geometry();
				for ( var i = 0; i < 300; i ++ ) {
					var planetVertex = new THREE.Vector3();
					planetVertex.x = (-1 + 2*Math.random())*1.4*sc;
					planetVertex.y = (-1 + 2*Math.random())*1.8*sc;
					planetVertex.z = -1 * GROUND_DIM / 2 - 600;
					planetGeometry.vertices.push( planetVertex );
				}
				planetMaterial = new THREE.PointsMaterial( { size: 30, sizeAttenuation: false, map: sprite, alphaTest: 0.5, transparent: true } );
				planetMaterial.color.setHSL( 1.0, 0.3, 0.7 );
				particles = new THREE.Points( planetGeometry, planetMaterial );

				scene.add( particles );

        //BG
        var bgGeometry = new THREE.PlaneGeometry(2*GROUND_DIM, 2*GROUND_DIM, GROUND_SQUARES, GROUND_SQUARES);
        bgMaterial = new THREE.MeshBasicMaterial({
            color: 0x123e84
        });
        var bgMesh = new THREE.Mesh( bgGeometry, bgMaterial );
        bgMesh.position.z = -1 * GROUND_DIM / 2 -800;
        scene.add(bgMesh)

        //Text
        /** TODO **/
}

function updateObjects() {

        // Pyramid
        pyramidMesh.rotation.y += 0.0002 * Math.pow(uniforms.lfAmp.value, 1.2);
        pyramidMesh.scale.y = PYRAMID_SCALE + 0.6 * uniforms.lfAmp.value;

        // Planets
        var h = ( 360 * ( 1.0 + time ) % 360 ) / 360;
		planetMaterial.color.setHSL( h, 0.5, 0.5 );
        planetMaterial.size = 5.0 + 0.6 * uniforms.lfAmp.value;
        particles.rotation.z += 0.0001 * Math.pow(uniforms.lfAmp.value, 1.2)
        particles.scale.y = 1 + 0.005 * uniforms.lfAmp.value;
        particles.scale.x = 1 + 0.005 * uniforms.lfAmp.value;

        // Background
        bgMaterial.color.r = 0.01 + 0.5*uniforms.lfAmp.value/255;
        bgMaterial.color.g = 0.04 + 0.2*uniforms.lfAmp.value/255;
        bgMaterial.color.b = 0.08 + 0.7*uniforms.lfAmp.value/255;

        // Camera
        camera.position.y = 10+0.6 * uniforms.lfAmp.value;
        camera.position.x = 20*Math.sin(time+0.05*uniforms.lfAmp.value);

        // Song title
        //text-shadow: 0 0 3px rgba(255,0,255,1.0);

        var blur = uniforms.lfAmp.value/255 * 100;
        var elems = document.getElementsByClassName('songTitle');
        for (var i = 0; i < elems.length; i++) {
                elems[i].style.textShadow = "0 0 " + blur + "px #FF00FF";
        }


}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

// animation loop
function animate() {
        requestAnimationFrame(animate);
        updateObjects();
        render();
}

// render the scene
function render() {
        // variable which is increase by Math.PI every seconds - usefull for animation
        time = (new Date().getTime() - startTime) / 1000;

        // update camera controls
        //cameraControls.update();

        // Update uniforms
        uniforms.time.value = time;

        // actually render the scene
        composer.render(); //render with post processing
        //renderer.render( scene, camera ); // render without post process
}

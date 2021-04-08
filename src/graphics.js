const PI = Math.PI;
const TAU = PI*2;
const rad = PI/180;
var cubeRotation = 0;

// math for shaders
const mat4 = new (require('./libraries/mat4'));
const vec3 = new (require('./libraries/vec3'));

function openModel (path) {
    data = ['dimension', 'normals', 'triangles', 'uv', 'vertices']
    model = {}
    Object.values(data).forEach(name => {
        var xml = new XMLHttpRequest()
        xml.onreadystatechange = () => {
            if(xml.status == 200 && xml.readyState == 4){
                var data = xml.responseText.split(',');
                data.pop();
                model[name] = data;
            }
        }
        xml.open("GET", `${path}/${name}.txt`, false)
        xml.send()
    })
    console.log('loaded')
    return model;
}

const models = openModel('./models/red')

function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture); 

    // Because images have to be downloaded over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0,0,255,255]);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

    const image = new Image();
    image.onload = () =>{
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image)

        if(isPowerOf2(image.width) && isPowerOf2(image.height)){
            gl.generateMipmap(gl.TEXTURE_2D)
        }else{
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        }
    }
    image.src = url
    return texture
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
} 

function sgn(x){
    return x<0?-1:1;
}

function initShaderProgram(gl, vsSource, fsSource){
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
        alert(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
        return null;
    }
    return shaderProgram;
};

function loadShader(gl, type, source){
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
        alert(`An error occurred compiling the shader: ${gl.getShaderInfoLog(shader)}`);
        return null;
    }
    return shader;
};

function initBuffers(gl, mod){
    //vertices, normals, triangles, uv, dimension
    console.log(mod)
    var positions = mod.vertices;
    var normals = mod.normals
    var textureCoordinates = mod.uv
    var indices = mod.triangles
    console.log(positions.length/3, indices.length, textureCoordinates.length/2)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);


    return {
        position: positionBuffer,
        normal: normalBuffer,
        indices: indexBuffer,
        textureCoord: textureCoordBuffer,
        vertexCount: indices.length
    };
};

function drawScene(gl, programInfo, buffers, texture, deltaTime){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const fieldOfView = 45*rad;
    const aspect = gl.canvas.clientWidth/gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 400;
    const projectionMatrix = mat4.perspective(fieldOfView, aspect, zNear, zFar);
    z = -3
    var modelViewMatrix = mat4.identity();
    var rotx = mat4.rotateX(-PI/2);
    var rotz = mat4.rotateZ(cubeRotation);

    // rotate model
    modelViewMatrix = mat4.multpiply(modelViewMatrix, mat4.translate(0, 0, z));
    modelViewMatrix = mat4.multpiply(modelViewMatrix, rotx);
    modelViewMatrix = mat4.multpiply(modelViewMatrix, rotz);

    // rotate normals
    var normalMatrix = mat4.identity();
    normalMatrix = mat4.multpiply(mat4.translate(0,0, -z), normalMatrix);
    normalMatrix = mat4.multpiply(mat4.transpose(rotx), normalMatrix);
    normalMatrix = mat4.multpiply(mat4.transpose(rotz), normalMatrix);
    normalMatrix = mat4.transpose(normalMatrix);

    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    }

    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexNormal,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);
    }

    {
        const numComponents = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
        gl.vertexAttribPointer(
            programInfo.attribLocations.textureCoord,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.useProgram(programInfo.program);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix
    );
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix
    );
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.normalMatrix,
        false,
        normalMatrix
    );

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

    {
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, buffers.vertexCount, type, offset);
    }
    cubeRotation+=deltaTime;
};

function main () {
    const canvas = document.querySelector("#glCanvas");
    const gl = canvas.getContext("webgl");
    if(!gl){
        alert("Unable to initialize WebGL.");
        return;
    }
    gl.clearColor(0.0,0.0,0.0,1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);
    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexNormal;
        attribute vec2 aTextureCoord;

        uniform mat4 uNormalMatrix;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        varying highp vec2 vTextureCoord;
        varying highp vec3 vLighting;

        void main(void){
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            vTextureCoord = aTextureCoord;

            //apply lighting

            highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
            highp vec3 directionalLightColor = vec3(1.0, 1.0, 1.0);
            highp vec3 directionalVector = normalize(vec3(0.83, 0.8, 0.75));

            highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

            highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
            vLighting = ambientLight + (directionalLightColor * directional);
        }`;

    const fsSource = `
        varying highp vec2 vTextureCoord;
        varying highp vec3 vLighting;

        uniform sampler2D uSampler;

        void main() {
            highp vec4 texelColor = texture2D(uSampler, vTextureCoord);

            gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
        }`;
    
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, `aVertexPosition`),
            vertexNormal: gl.getAttribLocation(shaderProgram, `aVertexNormal`),
            textureCoord: gl.getAttribLocation(shaderProgram, `aTextureCoord`)
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, `uProjectionMatrix`),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, `uModelViewMatrix`),
            normalMatrix: gl.getUniformLocation(shaderProgram, `uNormalMatrix`),
            uSampler: gl.getUniformLocation(shaderProgram, 'uSampler')
        }
    };

    var test = initBuffers(gl, models);
    console.log('inint')
    const texture = loadTexture(gl, './sprites/RenderTexture.png');

    var then = 0;
    function render(now){
        now*=0.001;
        const deltaTime = now-then;
        then = now;
        drawScene(gl, programInfo, test, texture, deltaTime);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}
window.onload = main;
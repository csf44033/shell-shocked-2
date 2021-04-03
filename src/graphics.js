const PI = Math.PI;
const TAU = PI*2;
const rad = PI/180;
var cubeRotation = 0;
console.log('started')
const mat4 = new (require('./libraries/mat4'));
const vec3 = new (require('./libraries/vec3'));
console.log('error');

function loadTexture(gl) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture); 

    // Because images have to be downloaded over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 100;
    const height = 100;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixels = new Uint8Array(width*height<<2).fill(0);
    var r,g,b;
    for(var i = 0; i < width; i ++){
        for(var j = 0; j < height; j ++){
            r =g=b=255;
            if(j>50) r = g = b = 100;

            var l = i + j * width << 2;
            pixels[l] = ((5*i/width)%1)*255;
            pixels[l+1]=0;
            pixels[l+2]=((5*j/height)%1)*255;
            pixels[l+3]=255;
        }
    }

    // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixels);  
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    return texture;
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
    var houses = [models.house0, models.house1, models.house2]
    var positions = [];
    positions = positions.concat(models.winston.vertices)
    var normals = models.winston.normals
    var textureCoordinates = models.winston.uv
    var indices = models.winston.triangles
    var vertex_count = models.winston.vertices.length/3;

    for(var j = 0; j < 3; j ++){
        var k = Math.random()*3|0

        normals = normals.concat(houses[k].normals)
        textureCoordinates = textureCoordinates.concat(houses[k].uv)

        for(var i = 0; i < houses[k].triangles.length; i ++){
            indices.push(houses[k].triangles[i] + vertex_count)
        }
        vertex_count += houses[k].vertices.length/3
        
        for(var i = 0; i < houses[k].vertices.length; i +=3){
            positions.push(houses[k].vertices[i] - 75)
            positions.push(houses[k].vertices[i+1] + (j-1)*houses[k].dimension[1])
            positions.push(houses[k].vertices[i+2] - houses[k].dimension[2])
        }
    }
    /*
    for(var j = 0; j < 3; j ++){
        textureCoordinates = textureCoordinates.concat(mod.uv)
        for(var i = 0; i < mod.triangles.length; i ++){
            indices.push(mod.triangles[i] + mod.vertices.length*(j+3)/3 + models.winston.vertices.length/3)
        }
        for(var i = 0; i < mod.vertices.length; i +=3){
            normals.push(-mod.normals[i])
            normals.push(-mod.normals[i+1])
            normals.push(mod.normals[i+2])
            positions.push(-mod.vertices[i]+75)
            positions.push(-mod.vertices[i+1]+ (j-1)*mod.dimension[1])
            positions.push(mod.vertices[i+2])
        }
    }*/
    console.log(positions.length, normals.length, mod.dimension[2])
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
    const zFar = 1000;
    const projectionMatrix = mat4.perspective(fieldOfView, aspect, zNear, zFar);
    z = -300
    var modelViewMatrix = mat4.identity();
    var rotx = mat4.rotateX(-PI/2);
    var rotz = mat4.rotateZ(cubeRotation);
    modelViewMatrix = mat4.multpiply(modelViewMatrix, mat4.translate(0, 0, z));
    modelViewMatrix = mat4.multpiply(modelViewMatrix, rotx);
    modelViewMatrix = mat4.multpiply(modelViewMatrix, rotz);
    var normalMatrix = mat4.identity();
    normalMatrix = mat4.multpiply(mat4.translate(0,0, -z), normalMatrix);
    normalMatrix = mat4.multpiply(mat4.transpose(rotx), normalMatrix);
    normalMatrix = mat4.multpiply(mat4.transpose(rotz), normalMatrix);
    normalMatrix = mat4.transpose(normalMatrix)
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

    var test = initBuffers(gl, models.house1);
    const texture = loadTexture(gl);

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
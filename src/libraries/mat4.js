module.exports = class {
    create () {
        return new Float32Array(16).fill(0);
    };
    identity(){
        var M = this.create();
        M[0] = M[5] = M[10] = M[15] = 1;
        return M;
    };
    rotatePlane(ux,uy,uz,mx,my){
        var M = this.create();
        var imx = 1 - mx;

        M[0] = mx + ux*ux*imx;
        M[1] = ux*uy*imx - uz*my;
        M[2] = ux*uz*imx + uy*my;

        M[4] = uy*ux*imx + uz*my;
        M[5] = mx + uy*uy*imx;
        M[6] = uy*uz*imx - ux*my;

        M[8] = uz*ux*imx - uy*my;
        M[9] = uz*uy*imx + ux*my;
        M[10] = mx + uz*uz*imx;
    };
    rotateX(theta){
        var res = this.identity();
        var cos = Math.cos(theta),
            sin = Math.sin(theta);
        res[5] = cos;
        res[6] = sin;
        res[9] = -sin;
        res[10] = cos;
        return res;
    };
    rotateY(theta){
        var res = this.identity();
        var cos = Math.cos(theta),
            sin = Math.sin(theta);
        res[0] = cos;
        res[2] = -sin;
        res[8] = sin;
        res[10] = cos;
        return res;
    };
    rotateZ(theta){
        var res = this.identity();
        var cos = Math.cos(theta),
            sin = Math.sin(theta);
        res[0] = cos;
        res[1] = sin;
        res[4] = -sin;
        res[5] = cos;
        return res;
    };
    frustum(l, r, b, t, n, f){
        var res = this.create();
        res[0] = 2*n/(r - l);
        res[5] = 2*n/(t - b);
        res[8] = (r + l)/(r - l);
        res[9] = (t + b)/(t - b);
        res[10] = (f + n)/(n - f);
        res[11] = -1;
        res[14] = 2*f*n/(n - f);
        return res;
    };
    perspective(fov, aspect, near, far){
        var f = near*Math.tan(fov/2);
        return this.frustum(-f*aspect, f*aspect, -f, f, near, far);
    };
    translate(x, y, z){
        var res = this.identity();
        res[12] = x;
        res[13] = y;
        res[14] = z;
        return res;
    };
    multpiply(a, b){
        var res = this.identity();
        for(var row = 0; row < 4; row ++){
            for(var col = 0; col < 4; col ++){
                res[row + col*4] = a[row]*b[col*4] + a[row+4]*b[1 + col*4] + a[row+8]*b[2 + col*4] + a[row+12]*b[3 + col*4];
            }
        }
        return res;
    };
    transpose(a){
        var M = this.create();
        for(var i = 0; i < 4; i ++){
            for(var j = 0; j < 4; j ++){
                M[i + j*4] = a[j + i*4];
            }
        }
        return M;
    };
}
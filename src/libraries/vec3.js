module.exports = class {
    add(v0,v1){
        return [
            v0[0]+v1[0],
            v0[1]+v1[1],
            v0[2]+v1[2]
        ];
    }
    sub(v0,v1){
        return [
            v0[0]-v1[0],
            v0[1]-v1[1],
            v0[2]-v1[2]
        ];
    }
    scale(v,s){
        return [
            v[0]*s,
            v[1]*s,
            v[2]*s
        ]
    }
    dot(v0,v1){
        return v0[0]*v1[0] + v0[1]*v1[1] + v0[2]*v1[2];
    }
    dist(v){
        return Math.sqrt(this.dot(v,v));
    }
    normal(v){
        return this.scale(v, 1/this.dist(v));
    }
}
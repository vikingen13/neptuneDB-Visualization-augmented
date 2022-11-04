const gremlin = require('gremlin');
const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;
const Graph = gremlin.structure.Graph;
const P = gremlin.process.P
const t = gremlin.process.t

const Order = gremlin.process.order
const Scope = gremlin.process.scope
const Column = gremlin.process.column
const __ = gremlin.process.statics


exports.handler = async (event, context, callback) => {
    const dc = new DriverRemoteConnection(`wss://${process.env.NEPTUNE_ENDPOINT}:${process.env.NEPTUNE_PORT}/gremlin`,{});
    const graph = new Graph();
    const g = graph.traversal().withRemote(dc);
    try {
        let result;

        if (event.pathParameters == null) {
        //Get the whole graph
            result = await g.V().valueMap(true).toList()           
        }else{
            //get the sub piece with the replacing piece
            result =  await g.V().has(t.id,event.pathParameters.piece).emit().repeat(__.in_("Son_of")).emit().repeat(__.out("Replaced_by")).valueMap(true).toList()
        }

        //Get the pieces who are only replacing others and have no son_of relationship
        const resultReplacing = await g.V().hasLabel('Piece').where(__.out("Son_of").count().is(0)).where(__.in_("Son_of").count().is(0)).valueMap(true).toList()

        const vertex =  result.map(r => {
            console.log(r);
            return {'id':r.get(t.id),'label':r.get('name')[0],'group':(r.get('deprecated')[0]=="yes"?"deprecated":"not deprecated")}
        })

        const replacing =  resultReplacing.map(r => {
            console.log(r);
            return {'id':r.get(t.id),'label':r.get('name')[0]}
        })

        let ReplacementOptions = []
        if (event.pathParameters != null) {
                //get the sub piece with the replacing piece
                const resultReplacementOptions = await g.V().has(t.id,event.pathParameters.piece).repeat(__.out("Replaced_by")).until(__.has('deprecated',"no")).valueMap(true).toList()
                ReplacementOptions =  resultReplacementOptions.map(r => {
                    console.log(r);
                    return {'id':r.get(t.id),'label':r.get('name')[0],'group':(r.get('deprecated')[0]=="yes"?"deprecated":"not deprecated")}
                })
        
            }
    
        

        const result2 = await g.E().toList()
        const edge = result2.map(r => {
            console.log(r)
            return {"from": r.outV.id,"to": r.inV.id,'label':r.label}
        })
        return {statusCode: 200,
                headers: {
                "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
                "Access-Control-Allow-Credentials" : true, // Required for cookies, authorization headers with HTTPS
                  },        
                body: JSON.stringify({'nodes':vertex,"edges":edge,"replacing":replacing, "replacementoptions":ReplacementOptions})
        }
      } catch (error) {
        console.error(JSON.stringify(error))
        return { error: error.message }
      }
}

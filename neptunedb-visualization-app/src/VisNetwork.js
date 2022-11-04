import React, { useEffect, useRef, useMemo } from "react";
import { v4 as uuidv4 } from 'uuid'

import Graph from "react-graph-vis";

const VisNetwork = ({graph,physics}) => {
    const version = useMemo(uuidv4, [{graph}]);

/*    const graph = {
        nodes: [
          { id: 1, label: "Node 1", title: "node 1 tootip text",color:"#FF0000",shape:"box",level:"0" },
          { id: 2, label: "Node 2", title: "node 2 tootip text", level:"1" },
          { id: 3, label: "Node 3", title: "node 3 tootip text", level:"1" },
          { id: 4, label: "Node 4", title: "node 4 tootip text", level:"1" },
          { id: 5, label: "Node 5", title: "node 5 tootip text", level:"1" }
        ],
        edges: [
          { from: 1, to: 2, label:"replaced by" },
          { from: 1, to: 3 },
          { from: 2, to: 4 },
          { from: 2, to: 5 }
        ]
      };
 */   

      console.log(graph);
      const options = {
        layout: {
          //hierarchical: true
        },
        nodes: {
            shape: "circle",
            color: "#8888FF",
            shadow:true,
            mass:3,
            scaling:{label:true}
        },
        groups: {
            deprecated: {color:'#FF8888'}
        },
        edges: {
          font: {color:"#FFFFFF",
                 strokeWidth:0},
          width:3,
          color: "#993333"
        },
        
        physics: {enabled:physics},
        height: (window.innerHeight - 90) + "px"
      };
    
      const events = {
        doubleClick: function(event) {
          //var { nodes, edges } = event;
          console.log(event);
          const myNewEvent = new CustomEvent('onDoubleClick',{ detail: {nodes:event.nodes} });

          // Next, we dispatch the event.
          document.dispatchEvent(myNewEvent);
        }
      };
      return (
        <Graph
            key={version}
          graph={graph}
          options={options}
          events={events}
          getNetwork={network => {
            //  if you want access to vis.js network api you can set the state in a parent component using this property
          }}
        />
      );
};

export default VisNetwork;
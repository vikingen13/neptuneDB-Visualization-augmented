import logo from './logo.svg';
import './App.css';
import { Amplify, API } from 'aws-amplify';
import backendConfig from './backendConfig.json'
import VisNetwork from './VisNetwork.js'
import { useEffect, useState, useRef } from 'react';
import { CheckboxField, Button, Card, Text, Heading, Badge, Rating } from '@aws-amplify/ui-react';
import { MdAutorenew } from "react-icons/md";
import '@aws-amplify/ui-react/styles.css';
import { ThemeProvider,defaultDarkModeOverride } from '@aws-amplify/ui-react';
import { Flex} from '@aws-amplify/ui-react';





Amplify.configure({
    API: backendConfig.API
});

const apiName = 'Neptune Service';
const path = '/'; 
const myInit = { // OPTIONAL
    headers: {"Access-Control-Allow-Origin" : "*",
    "content-type":"application/json"
    }, 
    response: true, // OPTIONAL (return the entire Axios response object instead of only response.data)
    queryStringParameters: {  // OPTIONAL

    },
};


function App() {

    const [myData,_setMyData] = useState({nodes: [],edges: [], replacementoptions: []})
    const [myGraphContent,setGraphContent] = useState({nodes: [],edges: []});
    const [isReplacedByIncluded,_setReplacedBy] = useState(true);
    const [myPiece,setPiece] = useState(undefined)
    const [isAnimated,setAnimation] = useState(true)
    const theme = {
        name: 'my-theme',
        overrides: [defaultDarkModeOverride],
      };
    
      //this trick is used to access the states value in the event listener
      //https://medium.com/geographit/accessing-react-state-in-event-listeners-with-usestate-and-useref-hooks-8cceee73c559
    const isReplacedByIncludedRef = useRef(isReplacedByIncluded);
    const setReplacedBy = data => {
        isReplacedByIncludedRef.current = data;
        _setReplacedBy(data);
    };

    const myDataRef = useRef(myData);
    const setMyData = data => {
        myDataRef.current = data;
        _setMyData(data);
    };


    useEffect(() => {
        document.addEventListener("onDoubleClick", NodeSelected);

        ApiCall(undefined);
    
    },[])

    function ApiCall(aPiece){
        const myPath = (aPiece===undefined)?"/":"/pieces/"+aPiece;

        API
        .get(apiName, myPath, myInit)
        .then(response => {
            response.data.nodes.push({id: "L1", label: "not deprecated", group: "not deprecated",shape:"box",x:-800,y:0,physics: false});
            response.data.nodes.push({id: "L2", label: "deprecated", group: "deprecated",shape:"box",x:-800,y:50,physics: false});

            //if there is a piece, we change its shape
            if( aPiece !== undefined){
                response.data.nodes.find(node => node.id === aPiece).font={color:"white",background:"gray",bold:true};
            }

            setMyData(response.data);
            
            console.log("myData api call");
            console.log(myData);

            console.log("value is replaced by before the call");
            console.log(isReplacedByIncludedRef.current);
            setGraphData(response.data,isReplacedByIncludedRef.current);
            
        })
        .catch(error => {
          console.log(error.response);
       });
    }

    function NodeSelected(anEvent){
        //First we check if there is a node selected
        const mySelectedNode = anEvent.detail.nodes[0];
        if(mySelectedNode !== undefined){
            ApiCall(mySelectedNode);
            setPiece(myDataRef.current.nodes.find(node => node.id === mySelectedNode));
        }
    }

    function toggleDisplayReplacedBy(isReplacedByIncludedNew){
        setReplacedBy(isReplacedByIncludedNew);
        setGraphData(myData,isReplacedByIncludedNew);
    }

    function setGraphData(aData,withReplaceBy){
        if(withReplaceBy){
            console.log("yes it should work");
            setGraphContent(aData);
        }else{
            setGraphContent({nodes:aData.nodes.filter(node => !(aData.replacing.map(function(o) { return o.id; }).includes(node.id))),edges:aData.edges.filter(edge => edge.label!=="Replaced_by")});
        }
    }

    function reStart(){
        ApiCall(undefined);
        setPiece(undefined);
    }


  return (
    <ThemeProvider theme={theme} colorMode="dark">
    <div className="App">
        <Heading level={1}>Demo Amplify / Vis.js / API Gateway / Lambda /NeptuneDB </Heading>
      <div className="App-header">        
        <Flex>            
            <VisNetwork graph={myGraphContent} physics={isAnimated}/>        
            <Flex direction="column" padding="50px">       
                <Button variation="primary" size="small" onClick={() => reStart()}><MdAutorenew/>Restart</Button>     
                <CheckboxField label="Animation" name="animated" value="yes" defaultChecked={true} onChange={(e) => setAnimation(e.target.checked)}/>
                <CheckboxField label="Remplaçants" name="replacedby" value="yes" defaultChecked={true} onChange={(e) => toggleDisplayReplacedBy(e.target.checked)}/>
                
                <Card variation="outlined">
                    <Heading level={5}>{(myPiece===undefined)?"All":myPiece.label}</Heading>
                    <Text as="em" lineHeight="1.5em" fontSize="0.6em">
                    id: {(myPiece===undefined)?"":myPiece.id}<br/>                    
                    </Text>
                    <Badge size="small" variation={(myPiece!==undefined)&&(myPiece.group==="not deprecated")?"success":"error"}>{(myPiece===undefined)?"":myPiece.group.replace(/ /g, "\u00A0")}</Badge>
                    <Text as="em" lineHeight="1.5em" fontSize="0.5em">
                    <br/>Remplaçants:
                    {myData.replacementoptions.map(piece => <li>{piece.label}</li>)}
                    
                    </Text>
                    {
                        (myPiece!==undefined)?<Rating size="small" value={Math.random()*5}></Rating>:null
                    }
                </Card>
            </Flex>            
        </Flex>
      </div>
    </div>
    </ThemeProvider>
  );
}

export default App;

import React, { useEffect, createRef, useState, forwardRef } from 'react';

import {
  Popover,
  Grid,
  Typography,
} from '@mui/material';

import { IFCSLAB } from "web-ifc";
import { IfcViewerAPI } from 'web-ifc-viewer';

import { Buffer } from 'buffer';

interface IfcRecord {
  [key: string]: string;
}

interface IfcContainerProps {
  viewer?: IfcViewerAPI;
}
const IfcContainer = forwardRef<HTMLDivElement, IfcContainerProps>((props, ref) => {

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [curIfcRecords, setIfcRecords] = useState<IfcRecord>();

  const viewer = props.viewer;
  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  const handleClose = () => {
    setAnchorEl(null);
  };

  const decode_ifc_str = (s: string) => {
    const expr = /\\X2\\.*?\\X0\\/g;
    let ret = s;
    console.log("ret:" + ret);
    let matchedStrings = ret.matchAll(expr);
    if (matchedStrings) {
      const decoder = new TextDecoder("UTF-16be");
      for (let matches of matchedStrings) {
        for (let m of matches) {
          let hex = m.replace("\\X2\\", "").replace("\\X0\\", "");
          let bf = Buffer.from(hex, 'hex');
          let decodedString = decoder.decode(bf);
          ret = ret.replaceAll(m, decodedString);
        }
      }
    }
    return ret;
  }


  const ifcOnClick = async (event) => {
    if (viewer) {
      const result = await viewer.IFC.selector.pickIfcItem(true);
      if (result) {
        const props = await viewer.IFC.getProperties(result.modelID, result.id, false);
        console.log(props);
        const type = await viewer.IFC.loader.ifcManager.getIfcType(result.modelID, result.id);
        // convert props to record
        if (props) {
          let ifcRecords: IfcRecord = {};
          ifcRecords['Entity Type'] = type;
          ifcRecords['GlobalId'] = props.GlobalId && props.GlobalId?.value;
          const name = props.Name && props.Name?.value;
          ifcRecords['Name'] = decode_ifc_str(name);
          const object_type = props.ObjectType && props.ObjectType?.value;
          ifcRecords['ObjectType'] = decode_ifc_str(object_type);
          ifcRecords['PredefinedType'] = props.PredefinedType && props.PredefinedType?.value;
          setIfcRecords(ifcRecords);
        }

        setAnchorEl(event.target);
      }
    }
  };

  const ifcOnRightClick = async () => {
    if (viewer) {
      viewer.clipper.deleteAllPlanes();
      viewer.clipper.createPlane();
    }
  }

  return (
    <>
      <div className={'ifcContainer'}
        ref={ref}
        onDoubleClick={ifcOnClick}
        onContextMenu={ifcOnRightClick}
        onMouseMove={viewer && (() => viewer.IFC.selector.prePickIfcItem())}
      />
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Grid
          container
          component='dl'
          spacing={2}
          sx={{ p: 2 }}>
          <Grid item>
            {curIfcRecords && Object.keys(curIfcRecords).map((key) =>
              curIfcRecords[key] &&
              <React.Fragment key={key}>
                <Typography component='dt' variant='body2'>{key}</Typography>
                <Typography sx={{ pb: 1 }} component='dd'>{curIfcRecords[key]}</Typography>
              </React.Fragment>
            )}
          </Grid>
        </Grid>
      </Popover>
    </>
  );
});

export { IfcContainer };

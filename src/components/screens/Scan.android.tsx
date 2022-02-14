import * as FaceDetector from "expo-face-detector"
import React, { useEffect, useReducer, useRef, useState } from "react"
import { StyleSheet, View, Dimensions, PixelRatio, StatusBar, Alert, ActivityIndicator } from "react-native"
import { Camera, FaceDetectionResult } from "expo-camera"
import { AnimatedCircularProgress } from "react-native-circular-progress"
import { ParamListBase, useNavigation } from "@react-navigation/native"
import Svg, { Path, SvgProps } from "react-native-svg"
import { Block, Button, Text, theme } from 'galio-framework';
import { materialTheme } from "../../constants"
import { StackNavigationProp } from "@react-navigation/stack"
import { BASE_URL, insideScan } from "../../constants/utils"

import { from, mergeMap, asyncScheduler, of, Subscription, concat, ObservableInput } from 'rxjs';
import { filter, map, observeOn, take } from 'rxjs/operators';
import { ajax } from 'rxjs/ajax';

import * as FileSystem from 'expo-file-system';

const { width: windowWidth } = Dimensions.get("window")

type capturedImageProp = {
  base64?: string,
  uri?: string,
  timestamp: number,
  minInterval: number
}

let arrTempLeft: capturedImageProp[] = []
let arrTempRight: capturedImageProp[] = []
let arrFinalImages: capturedImageProp[] = []

let extraIntervalLeft = 0
let extraIntervalRight = 0

let isCameraReady = false

let captureObservable: Subscription
let leftImageProcessObservable: ObservableInput<capturedImageProp>
let rightImageProcessObservable: ObservableInput<capturedImageProp>

const MIN_INTERVAL = 1500
const PER_EAR_IMAGE_COUNT = 10
const FINAL_EAR_IMAGE_COUNT = PER_EAR_IMAGE_COUNT * 2
const WAIT_DURATION = (MIN_INTERVAL * (PER_EAR_IMAGE_COUNT * 2)) / 1000

// TODO: Thresholds are different for MLKit Android
// TODO: Camera preview size takes actual specified size and not the entire screen.

interface FaceDetection {
  rollAngle: number
  yawAngle: number
  smilingProbability: number
  leftEyeOpenProbability: number
  rightEyeOpenProbability: number
  bounds: {
    origin: {
      x: number
      y: number
    }
    size: {
      width: number
      height: number
    }
  }
}

const detections = {
  TURN_HEAD_LEFT: {
    promptText: `Turn head left \n Keep until approx. upto ${WAIT_DURATION} sec`,
    maxAngle: 320,
    minAngle: 300,
  },
  TURN_HEAD_RIGHT: {
    promptText: `Turn head right \n Keep until approx. upto ${WAIT_DURATION} sec`,
    maxAngle: 60,
    minAngle: 40,
  },
  // FACE_ON: { promptText: 'Face the camera', maxAngle: 360, minAngle: 0 }, // TODO: set these
  UPLOAD: { promptText: 'Uploading...', maxAngle: 360, minAngle: 0 },
};

type DetectionActions = keyof typeof detections

const promptsText = {
  noFaceDetected: "No face detected",
  performActions: "Perform the following actions:"
}

const detectionsList: DetectionActions[] = [
  'TURN_HEAD_LEFT',
  'TURN_HEAD_RIGHT',
  'UPLOAD',
];

let detectionAction = "FACE_CAMERA"

const initialState = {
  faceDetected: false,
  promptText: promptsText.noFaceDetected,
  detectionsList,
  currentDetectionIndex: 0,
  progressFill: 0,
  processComplete: false
}

export default function Scan() {
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>()
  const [hasPermission, setHasPermission] = useState(false)
  const [state, dispatch] = useReducer(detectionReducer, initialState)
  const rollAngles = useRef<number[]>([])
  const rect = useRef<View>(null)
  const cameraRef = useRef<Camera | null>();

  const [inProcess, showProcessing] = React.useState(false);
  const [isUploading, setUploading] = React.useState(false);

  useEffect(() => {
        
    arrTempLeft = []
    arrTempRight = []
    arrFinalImages = []

    extraIntervalLeft = 0
    extraIntervalRight = 0

    isCameraReady = false

    const requestPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === "granted")
    }

    requestPermissions()
  }, [])

  useEffect(() => {
    const unsubFocus = navigation.addListener('focus', () => {
      insideScan(true)
    });
    const unsubBlur = navigation.addListener('blur', () => {
      insideScan(false)
    });
    return () => {
      // executed when unmount
      unsubFocus();
      unsubBlur();
    }
  }, [navigation]);

  useEffect(() => {
    // clearing all previous captured images from cache
    FileSystem.getInfoAsync(FileSystem.cacheDirectory! + "/Camera")
      .then((dirInfo) => {
        console.log("dir", dirInfo)
        if (dirInfo.exists) {
          FileSystem.deleteAsync(dirInfo.uri)
            .then((value) => {
              console.log("cached images deleted...")
            }).catch((err1) => {
              console.log("err1", err1)
            })
        }
      }).catch((err) => {
        console.log("err", err)
      })
  }, [])
  
  const drawFaceRect = (face: FaceDetection) => {
    rect.current?.setNativeProps({
      width: face.bounds.size.width,
      height: face.bounds.size.height,
      top: face.bounds.origin.y,
      left: face.bounds.origin.x
    })
  }

  const captureImageUsingObservable = () => {
    console.log("isCameraReady", isCameraReady)
    if (cameraRef.current && isCameraReady) {
      console.log("capture start", Date.now())
      isCameraReady = false
      captureObservable = from(cameraRef.current.takePictureAsync({
        base64: false, 
        quality: 0.5,
        // skipProcessing: true
      }))
        .pipe(observeOn(asyncScheduler), mergeMap(capturedImage => {
          console.log("captured", capturedImage)
          isCameraReady = true
          let minInterval
          if (detectionAction == "TURN_HEAD_LEFT") {
            minInterval = arrTempLeft.length == 0 ? MIN_INTERVAL : Date.now() - arrTempLeft[arrTempLeft.length - 1].timestamp
          } else {
            minInterval = arrTempRight.length == 0 ? MIN_INTERVAL : Date.now() - arrTempRight[arrTempRight.length - 1].timestamp
          }
          let extraData: capturedImageProp = {
            timestamp: Date.now(),
            minInterval
          }
          return of(extraData).pipe(map(data => {
            data.uri = capturedImage.uri
            // data.base64 = capturedImage.base64
            return data
          }))
        }))
        .subscribe({
          next(finalData) {
            console.log("finalData", finalData)
            console.log("capture end", Date.now())
            if (detectionAction == "TURN_HEAD_LEFT") {
              arrTempLeft.push(finalData)
            } else {
              arrTempRight.push(finalData)
            }
            console.log("leftEarImages", arrTempLeft.length)
            console.log("rightEarImages", arrTempRight.length)
          },
          error(err) {
            console.log("error-->", err)
          },
          complete() {
            console.log("complete")
            captureObservable.unsubscribe()
          }
        })
    }
  }

  const processImagesUsingOperator = () => {
    extraIntervalLeft = 0
    extraIntervalRight = 0
    leftImageProcessObservable = from(arrTempLeft)
      .pipe(filter(val => {
        console.log("left", val)
        console.log("extraIntervalLeft", extraIntervalLeft)
        if ((val.minInterval + extraIntervalLeft) >= MIN_INTERVAL) {
          extraIntervalLeft = 0
          return true
        } else {
          extraIntervalLeft = extraIntervalLeft + val.minInterval
          return false
        }
      }), take(PER_EAR_IMAGE_COUNT))

    rightImageProcessObservable = from(arrTempRight)
      .pipe(filter(val => {
        console.log("right", val)
        console.log("extraIntervalRight", extraIntervalRight)
        if ((val.minInterval + extraIntervalRight) >= MIN_INTERVAL) {
          extraIntervalRight = 0
          return true
        } else {
          extraIntervalRight = extraIntervalRight + val.minInterval
          return false
        }
      }), take(PER_EAR_IMAGE_COUNT))

    concat(leftImageProcessObservable, rightImageProcessObservable)
      .subscribe({
        next(value) {
          console.log("filtered value", value)
          arrFinalImages.push(value)
        },
        error(err) {
          console.log("error-->", err)
        },
        complete() {
          console.log("process complete", arrFinalImages)
          if (arrFinalImages.length < FINAL_EAR_IMAGE_COUNT) {
            // TODO: repeat the whole process
            setUploading(false)
          } else {
            getUploadUrlUsingAjax()
          }
        }
      });
  }

  const getUploadUrlUsingAjax = () => {
      const getPreSignedUrl = ajax({
        url: BASE_URL + '/init',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }).pipe(observeOn(asyncScheduler))
      getPreSignedUrl.subscribe({
        next(res) {
          console.log("response", res.response)
          let imageObject: any = res.response
          if (imageObject && imageObject.imageURL != "") {
            uploadImagesUsingAjax(imageObject.imageURL)
          } else {
            setUploading(false)
            Alert.alert("Something went wrong!")
          }
        },
        error(err) {
          console.log("init error", JSON.stringify(err))
          setUploading(false)
          Alert.alert("Something went wrong!")
        },
        complete() {
          console.log("init complete")
        }
      })
  }

  const uploadImagesUsingAjax = (imageUrl: string) => {
    
    from(arrFinalImages)
      .pipe(observeOn(asyncScheduler), mergeMap(value => {
        let name = value.uri?.substring(value.uri.lastIndexOf('/') + 1)
        const newFile = {
          name: name,
          uri: value.uri,
          type: "image/jpg"
        }
        
        var formData = new FormData();
        formData.append('', newFile);
        console.log("formData", formData)
    
        const uploadImages = ajax({
          url: imageUrl,
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data'
          },
          body: formData
        })
        return uploadImages
      })).subscribe({
        next(res) {
          console.log("upload response", res.response)
          let resObject: any = res.response
          if (resObject && resObject.status == 201) {
            console.log("upload done")
          }
        },
        error(err) {
          console.log("upload error", JSON.stringify(err))
        },
        complete() {
          console.log("upload complete")
          setUploading(false)
          navigation.replace('ScanComplete')
        }
      })
  }

  function clickDone() {
    console.log("Final left ears data", arrTempLeft.length)
    console.log("Final right ears data", arrTempRight.length)
    navigation.replace('ScanComplete')
  }

  const onFacesDetected = (result: FaceDetectionResult) => {
    if (result.faces.length !== 1) {
      dispatch({ type: "FACE_DETECTED", value: "no" })
      return
    }
    // console.log("face: ", JSON.stringify(result))

    const face: FaceDetection = result.faces[0]

    // offset used to get the center of the face, instead of top left corner
    const midFaceOffsetY = face.bounds.size.height / 2
    const midFaceOffsetX = face.bounds.size.width / 2

    drawFaceRect(face)
    // make sure face is centered
    const faceMidYPoint = face.bounds.origin.y + midFaceOffsetY
    // console.log(`face.bounds.origin.y: ${face.bounds.origin.y}`)
    if (
      // if middle of face is outside the preview towards the top
      faceMidYPoint <= PREVIEW_MARGIN_TOP ||
      // if middle of face is outside the preview towards the bottom
      faceMidYPoint >= PREVIEW_SIZE + PREVIEW_MARGIN_TOP
    ) {
      dispatch({ type: "FACE_DETECTED", value: "no" })
      return
    }

    const faceMidXPoint = face.bounds.origin.x + midFaceOffsetX
    if (
      // if face is outside the preview towards the left
      faceMidXPoint <= windowWidth / 2 - PREVIEW_SIZE / 2 ||
      // if face is outside the preview towards the right
      faceMidXPoint >= windowWidth / 2 + PREVIEW_SIZE / 2
    ) {
      dispatch({ type: "FACE_DETECTED", value: "no" })
      return
    }

    // drawFaceRect(face)

    if (!state.faceDetected) {
      dispatch({ type: "FACE_DETECTED", value: "yes" })
    }

    detectionAction = state.detectionsList[state.currentDetectionIndex]
    console.log("detection", detectionAction)
    // console.log("detection time", Date.now())

    switch (detectionAction) {
      case "TURN_HEAD_LEFT":
        if (
          face.yawAngle <= detections.TURN_HEAD_LEFT.maxAngle &&
          face.yawAngle >= detections.TURN_HEAD_LEFT.minAngle
        ) {
          showProcessing(true)
          if (arrTempLeft.length < PER_EAR_IMAGE_COUNT) {
            captureImageUsingObservable()
          } else {
            dispatch({ type: "NEXT_DETECTION", value: null })
          }
        } else {
          showProcessing(false)
        }
        return
      case "TURN_HEAD_RIGHT":
        if (
          face.yawAngle <= detections.TURN_HEAD_RIGHT.maxAngle &&
          face.yawAngle >= detections.TURN_HEAD_RIGHT.minAngle
        ) {
          showProcessing(true)
          if (arrTempRight.length < PER_EAR_IMAGE_COUNT) {
            captureImageUsingObservable()
          } else {
            dispatch({ type: "NEXT_DETECTION", value: null })
          }
        } else {
          showProcessing(false)
        }
        return
      case 'UPLOAD':
        // TODO: CONFIG THE BELOW AXIOS ENDPOINT
        //  upload logic
        showProcessing(false)
        if (!isUploading) {
          setUploading(true)
          processImagesUsingOperator()
          dispatch({ type: 'NEXT_DETECTION', value: null })
        }
        return;
    }
  }

  if (hasPermission === false) {
    return <Text>No access to camera</Text>
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Block height={30} />
      {isUploading ?
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator color={"white"} size="large" />
          <Text style={styles.faceStatus}>
              Uploading... Please wait...
          </Text>
        </View> : <>
      <Block center>
        <Text color="white" size={60}>
          Scan
        </Text>
      </Block>
      <View style={{ flex: 1 }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          width: "100%",
          height: PREVIEW_MARGIN_TOP,
          backgroundColor: "black",
          zIndex: 10
        }}
      />
      <View
        style={{
          position: "absolute",
          top: PREVIEW_MARGIN_TOP,
          left: 0,
          width: (windowWidth - PREVIEW_SIZE) / 2,
          height: PREVIEW_SIZE,
          backgroundColor: "black",
          zIndex: 10
        }}
      />
      <View
        style={{
          position: "absolute",
          top: PREVIEW_MARGIN_TOP,
          right: 0,
          width: (windowWidth - PREVIEW_SIZE) / 2 + 1,
          height: PREVIEW_SIZE,
          backgroundColor: "black",
          zIndex: 10
        }}
      />
      <View
        style={{
          position: "absolute",
          top: PREVIEW_MARGIN_TOP + PREVIEW_SIZE,
          width: "100%",
          height: "100%",
          backgroundColor: "black",
          zIndex: 10
        }}
      />

      <Camera
        style={styles.cameraPreview}
        type={Camera.Constants.Type.front}
        autoFocus="off"
        useCamera2Api={true}
        onFacesDetected={onFacesDetected}
        onCameraReady={() => {
          console.log("camera ready");
          isCameraReady = true
        }}
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.fast,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
          runClassifications: FaceDetector.FaceDetectorClassifications.none,
          minDetectionInterval: 100,
          tracking: false
        }}
        ref={(camera) => {
          cameraRef.current = camera;
        }}>
        <CameraPreviewMask width={"100%"} style={styles.circularProgress} />
        <AnimatedCircularProgress
          style={styles.circularProgress}
          size={PREVIEW_SIZE}
          width={5}
          backgroundWidth={7}
          fill={state.progressFill}
          tintColor="#3485FF"
          backgroundColor="#e8e8e8"
        />
      </Camera>
      <View
        ref={rect}
        style={{
          position: "absolute",
          borderWidth: 2,
          borderColor: "pink",
          zIndex: 10
        }}
      />
      {inProcess ? <View style={styles.promptContainer}>
        <Text style={styles.faceStatus}>
          Processing... Please wait...
        </Text>
      </View>
      :
      <View style={styles.promptContainer}>
        <Text style={styles.faceStatus}>
          {!state.faceDetected && promptsText.noFaceDetected}
        </Text>
        <Text style={styles.actionPrompt}>
          {state.faceDetected && promptsText.performActions}
        </Text>
        <Text style={styles.action}>
          {state.faceDetected &&
            detections[state.detectionsList[state.currentDetectionIndex]]
              .promptText}
        </Text>
      </View>}
        {/* {!state.processComplete ? <Block center style={{ zIndex: 30 }}>
          <Button
            shadowless
            style={styles.button}
            color={materialTheme.COLORS.BUTTON_COLOR}
            onPress={() => clickDone()}>
            Done
          </Button>
        </Block> : <View />} */}
      </View>
      </>}
    </View>
  )
}

interface Action<T extends keyof Actions> {
  type: T
  value: Actions[T]
}
interface Actions {
  FACE_DETECTED: "yes" | "no"
  NEXT_DETECTION: null
}

const detectionReducer = (
  state: typeof initialState,
  action: Action<keyof Actions>
): typeof initialState => {
  const numDetections = state.detectionsList.length
  // +1 for face detection
  const newProgressFill =
    (100 / (numDetections + 1)) * (state.currentDetectionIndex + 1)

  switch (action.type) {
    case "FACE_DETECTED":
      if (action.value === "yes") {
        return { ...state, faceDetected: true, progressFill: newProgressFill }
      } else {
        // Reset
        return initialState
      }
    case "NEXT_DETECTION":
      const nextIndex = state.currentDetectionIndex + 1
      if (nextIndex === numDetections) {
        // success
        return { ...state, processComplete: true, progressFill: 100 }
      }
      // next
      return {
        ...state,
        currentDetectionIndex: nextIndex,
        progressFill: newProgressFill
      }
    default:
      throw new Error("Unexpeceted action type.")
  }
}

const CameraPreviewMask = (props: SvgProps) => (
  <Svg width={320} height={320} viewBox="0 0 300 300" fill="none" {...props}>
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M150 0H0v300h300V0H150zm0 0c82.843 0 150 67.157 150 150s-67.157 150-150 150S0 232.843 0 150 67.157 0 150 0z"
      fill="#000"
    />
  </Svg>
)

const PREVIEW_MARGIN_TOP = 50
const PREVIEW_SIZE = 320

const styles = StyleSheet.create({
  actionPrompt: {
    fontSize: 20,
    textAlign: "center",
    color: "white"
  },
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
  promptContainer: {
    // position: "absolute",
    alignSelf: "center",
    top: (-100),
    // height: "100%",
    width: "100%",
    zIndex: 20,
    flex: 1,
  },
  faceStatus: {
    fontSize: 24,
    textAlign: "center",
    marginTop: 10,
    color: "white"
  },
  cameraPreview: {
    // flex: 1,
    height: (windowWidth * 4) / 3,
    width: windowWidth,
  },
  circularProgress: {
    position: "absolute",
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    top: PREVIEW_MARGIN_TOP,
    alignSelf: "center"
  },
  action: {
    fontSize: 24,
    textAlign: "center",
    marginTop: 10,
    fontWeight: "bold",
    color: "white"
  },
  padded: {
    paddingHorizontal: theme.SIZES!.BASE! * 2,
    position: 'relative',
    bottom: theme.SIZES!.BASE,
    alignItems: 'center',
  },
  button: {
    width: windowWidth - theme.SIZES!.BASE! * 4,
    height: theme.SIZES!.BASE! * 3,
    shadowRadius: 0,
    shadowOpacity: 0,
  },
})
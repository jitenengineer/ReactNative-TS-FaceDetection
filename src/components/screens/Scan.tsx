import React, { useState, useReducer, useEffect, useRef } from 'react';
import {
  StyleSheet,
  StatusBar,
  Dimensions,
  View,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Block, Button, Text, theme } from 'galio-framework';

import materialTheme from '../../constants/Theme';
import MaskedView from '@react-native-community/masked-view';
import { Camera, FaceDetectionResult } from 'expo-camera';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { contains, Rect } from '../../constants/contains';
import * as FaceDetector from 'expo-face-detector';
import { useNavigation, ParamListBase } from '@react-navigation/native';
import { BASE_URL, insideScan } from '../../constants/utils';
import { StackNavigationProp } from '@react-navigation/stack';

import { from, mergeMap, of, Subscription, concat, ObservableInput } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { ajax } from 'rxjs/ajax';

import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get("window")

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

const MIN_INTERVAL = 300
const PER_EAR_IMAGE_COUNT = 10
const FINAL_EAR_IMAGE_COUNT = PER_EAR_IMAGE_COUNT * 2
const WAIT_DURATION = (MIN_INTERVAL * (PER_EAR_IMAGE_COUNT * 2)) / 1000

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

const PREVIEW_SIZE = 325
const PREVIEW_RECT: Rect = {
  minX: (width - PREVIEW_SIZE) / 2,
  minY: 50,
  width: PREVIEW_SIZE,
  height: PREVIEW_SIZE
}

const instructionsText = {
  initialPrompt: "Position your face in the circle",
  performActions: "Keep the device still and perform the following actions:",
  tooClose: "You're too close. Hold the device further."
}

const detections = {
  TURN_HEAD_LEFT: {
    promptText: `Turn head left \n Keep until approx. upto ${WAIT_DURATION} sec`,
    maxAngle: -15
  },
  TURN_HEAD_RIGHT: {
    promptText: `Turn head right \n Keep until approx. upto ${WAIT_DURATION} sec`,
    minAngle: 15
  },
  // FACE_ON: { promptText: 'Face the camera', maxAngle: 360, minAngle: 0 }, // TODO: set these
  UPLOAD: { promptText: 'Uploading...', maxAngle: 360, minAngle: 0 },
};

type DetectionActions = keyof typeof detections

const detectionsList: DetectionActions[] = [
  "TURN_HEAD_LEFT",
  "TURN_HEAD_RIGHT",
  "UPLOAD"
]

let detectionAction = "FACE_CAMERA"

const initialState = {
  faceDetected: "no" as "yes" | "no",
  faceTooBig: "no" as "yes" | "no",
  detectionsList,
  currentDetectionIndex: 0,
  progressFill: 0,
  processComplete: false
}

interface Actions {
  FACE_DETECTED: "yes" | "no"
  FACE_TOO_BIG: "yes" | "no"
  NEXT_DETECTION: null
}

interface Action<T extends keyof Actions> {
  type: T
  payload: Actions[T]
}

type PossibleActions = {
  [K in keyof Actions]: Action<K>
}[keyof Actions]

const detectionReducer = (
  state: typeof initialState,
  action: PossibleActions
): typeof initialState => {
  switch (action.type) {
    case "FACE_DETECTED":
      if (action.payload === "yes") {
        return {
          ...state,
          faceDetected: action.payload,
          progressFill: 100 / (state.detectionsList.length + 1)
        }
      } else {
        // Reset
        return initialState
      }
    case "FACE_TOO_BIG":
      return { ...state, faceTooBig: action.payload }
    case "NEXT_DETECTION":
      // next detection index
      const nextDetectionIndex = state.currentDetectionIndex + 1

      // skip 0 index
      const progressMultiplier = nextDetectionIndex + 1

      const newProgressFill =
        (100 / (state.detectionsList.length + 1)) * progressMultiplier

      if (nextDetectionIndex === state.detectionsList.length) {
        // success
        return {
          ...state,
          processComplete: true,
          progressFill: newProgressFill
        }
      }
      // next
      return {
        ...state,
        currentDetectionIndex: nextDetectionIndex,
        progressFill: newProgressFill
      }
    default:
      throw new Error("Unexpected action type.")
  }
}

export default function Scan() {
    
  const navigation = useNavigation<StackNavigationProp<ParamListBase>>()
  const [hasPermission, setHasPermission] = React.useState(false)
  const [state, dispatch] = useReducer(detectionReducer, initialState)
  const rollAngles = useRef<number[]>([])
  const cameraRef = useRef<Camera | null>();

  const [inProcess, showProcessing] = React.useState(false);
  const [isUploading, setUploading] = React.useState(false);

  useEffect(() => {
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
  
  const captureImageUsingObservable = () => {
    console.log("isCameraReady", isCameraReady)
    if (cameraRef.current && isCameraReady) {
      console.log("capture start", Date.now())
      isCameraReady = false
      captureObservable = from(cameraRef.current.takePictureAsync({
        base64: false
      }))
        .pipe(mergeMap(capturedImage => {
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
      .pipe(filter((val) => {
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
          console.log("complete", arrFinalImages)
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
      })
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
      .pipe(mergeMap(value => {
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
    // 1. There is only a single face in the detection results.
    if (result.faces.length !== 1) {
      dispatch({ type: "FACE_DETECTED", payload: "no" })
      return
    }

    const face: FaceDetection = result.faces[0]
    const faceRect: Rect = {
      minX: face.bounds.origin.x,
      minY: face.bounds.origin.y,
      width: face.bounds.size.width,
      height: face.bounds.size.height
    }

    // 2. The face is almost fully contained within the camera preview.
    const edgeOffset = 50
    const faceRectSmaller: Rect = {
      width: faceRect.width - edgeOffset,
      height: faceRect.height - edgeOffset,
      minY: faceRect.minY + edgeOffset / 2,
      minX: faceRect.minX + edgeOffset / 2
    }
    const previewContainsFace = contains({
      outside: PREVIEW_RECT,
      inside: faceRectSmaller
    })
    if (!previewContainsFace) {
      dispatch({ type: "FACE_DETECTED", payload: "no" })
      return
    }

    if (state.faceDetected === "no") {
      // 3. The face is not as big as the camera preview.
      const faceMaxSize = PREVIEW_SIZE - 90
      if (faceRect.width >= faceMaxSize && faceRect.height >= faceMaxSize) {
        dispatch({ type: "FACE_TOO_BIG", payload: "yes" })
        return
      }

      if (state.faceTooBig === "yes") {
        dispatch({ type: "FACE_TOO_BIG", payload: "no" })
      }
    }

    if (state.faceDetected === "no") {
      dispatch({ type: "FACE_DETECTED", payload: "yes" })
    }
    // console.log("face: ", JSON.stringify(result))

    detectionAction = state.detectionsList[state.currentDetectionIndex]

    switch (detectionAction) {
      case "TURN_HEAD_LEFT":
        if (
          face.yawAngle <= detections.TURN_HEAD_LEFT.maxAngle
        ) {
          showProcessing(true)
          if (arrTempLeft.length < PER_EAR_IMAGE_COUNT) {
            captureImageUsingObservable()
          } else {
            dispatch({ type: "NEXT_DETECTION", payload: null })
          }
        } else {
          showProcessing(false)
        }
        return
      case "TURN_HEAD_RIGHT":
        if (
          face.yawAngle >= detections.TURN_HEAD_RIGHT.minAngle
        ) {
          showProcessing(true)
          if (arrTempRight.length < PER_EAR_IMAGE_COUNT) {
            captureImageUsingObservable()
          } else {
            dispatch({ type: "NEXT_DETECTION", payload: null })
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
          dispatch({ type: 'NEXT_DETECTION', payload: null })
        }
        return;
    }
  }

  if (hasPermission === false) {
    return <Text>No access to camera</Text>
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Block flex space="between" style={styles.padded}>
        <Block height={20} />
        {isUploading ?
          <View style={{ flex: 1, justifyContent: "center" }}>
            <ActivityIndicator color={"white"} size="large" />
            <Text style={styles.faceStatus}>
                Uploading... Please wait...
            </Text>
          </View> :
          <Block flex center>
            <Text color="white" size={60}>
              Scan
            </Text>
            <Block center width={width} height={(width * 4) / 3}>
              <MaskedView
                style={StyleSheet.absoluteFill}
                maskElement={<View style={styles.mask} />}
              >
                <Camera
                  style={StyleSheet.absoluteFill}
                  // style={{ width: 325, height: 325 }}
                  // ratio={"1:1"}
                  type={Camera.Constants.Type.front}
                  onFacesDetected={onFacesDetected}
                  ref={(camera) => {
                    cameraRef.current = camera;
                  }}
                  faceDetectorSettings={{
                    mode: FaceDetector.FaceDetectorMode.fast, // ignore faces in the background
                    detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
                    runClassifications: FaceDetector.FaceDetectorClassifications.none,
                    minDetectionInterval: 125,
                    tracking: false
                  }}
                  onCameraReady={() => {
                    console.log("camera ready");
                    isCameraReady = true
                  }}
                >
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
              </MaskedView>
              {inProcess ? <View style={styles.instructionsContainer}>
                <Text style={styles.faceStatus}>
                  Processing... Please wait...
                </Text>
              </View>
              :
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructions}>
                  {state.faceDetected === "no" &&
                    state.faceTooBig === "no" &&
                    instructionsText.initialPrompt}

                  {state.faceTooBig === "yes" && instructionsText.tooClose}

                  {state.faceDetected === "yes" &&
                    state.faceTooBig === "no" &&
                    instructionsText.performActions}
                </Text>
                <Text style={styles.action}>
                  {state.faceDetected === "yes" &&
                    state.faceTooBig === "no" &&
                    detections[state.detectionsList[state.currentDetectionIndex]]
                      .promptText}
                </Text>
              </View>}
            </Block>
          {/* {!state.processComplete ? <Block center>
            <Button
              shadowless
              style={styles.button}
              color={materialTheme.COLORS.BUTTON_COLOR}
              onPress={() => clickDone()}>
              Done
            </Button>
          </Block> : <View />} */}
        </Block>}
      </Block>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  mask: {
    borderRadius: PREVIEW_SIZE / 2,
    height: PREVIEW_SIZE,
    width: PREVIEW_SIZE,
    marginTop: PREVIEW_RECT.minY,
    alignSelf: "center",
    backgroundColor: "white"
  },
  circularProgress: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    marginTop: PREVIEW_RECT.minY,
    marginLeft: PREVIEW_RECT.minX
  },
  instructions: {
    fontSize: 20,
    textAlign: "center",
    top: 0,
    color: "white",
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: PREVIEW_RECT.minY + PREVIEW_SIZE
  },
  action: {
    fontSize: 24,
    textAlign: "center",
    color: "white",
    fontWeight: "bold"
  },

  outerCircle: {
    backgroundColor: 'green',
    width: 150,
    height: 150,
    borderRadius: 150 / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    backgroundColor: 'grey',
    width: 130,
    height: 130,
    borderRadius: 130 / 2,
  },
  padded: {
    paddingHorizontal: theme.SIZES!.BASE! * 2,
    position: 'relative',
    bottom: theme.SIZES!.BASE,
    alignItems: 'center',
  },
  button: {
    width: width - theme.SIZES!.BASE! * 4,
    height: theme.SIZES!.BASE! * 3,
    shadowRadius: 0,
    shadowOpacity: 0,
  },
  faceStatus: {
    fontSize: 24,
    textAlign: "center",
    marginTop: 10,
    color: "white"
  },
  imageview: {
    width: 50,
    height: 50,
    borderRadius: 10,
    padding: 5,
    margin: 5,
    backgroundColor: "white"
  },
});

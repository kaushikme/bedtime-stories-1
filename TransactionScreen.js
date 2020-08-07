import React from "react";
import {Text,  View, TouchableOpacity, TextInput, Image, StyleSheet, KeyboardAvoidingView, Alert} from "react-native"
 import * as Permissions from "expo-permissions"
 import  { BarCodeScanner } from "expo-barcode-scanner"
 import * as firebase from "firebase"
 

export default class TransactionScreen extends React.Component{
constructor() {
    super();
    this.state = {
        hasCameraPermissions: null,
        scanned: false,
        scannedBookId: '',
        scannedStudentId:'',
        buttonState: 'normal',
        transactionMessage: ''
    }
}

getCameraPermissions = async(id) =>{
    const {status} = await Permissions.askAsync(Permissions.CAMERA);

    this.setState({
        hasCameraPermissions: status === 'granted',
        buttonState: id,
        scanned: false,
    });
}

handleBarCodeScanned = async ({type, data}) => {
    const {buttonState} = this.state

    if (buttonState === 'BookId') {
this.setState({
    scanned: true,
    scannedBookId: data,
    buttonState: 'normal',
});
    }

    else if (buttonState === 'PersonId') {
        this.setState({
            scanned: true,
            scannedStudentId: true,
            buttonState: 'normal',
        });
    }   
}
initiateBookIssue = async() => {
    db.collection('transactions').add({
        'studentId' : this.state.scannedStudentId,
        'bookId' : this.state.scannedBookId,
        'date': firebase.firestore.Timestamp.now().toDate,
        'transactionType' : 'Issue',
    })

    db.collection ('books').doc(this.state.scannedBookId).update({
        'bookAvailability' : false
    })
    db.collection('students').doc(this.state.scannedStudentId).update({
        numberOfBooksIssued : firebase.firestore.FieldValue.increment(1)


    })

    Alert.alert('Book Issued!')

    this.setState({
        scannedStudentId: '',
        scannedBookId: '',
    })
}

initiateBookReturn = async () => {
    db.collection('transactions').add({
        'studentId': this.state.scannedStudentId,
        'bookId' : this.state.scannedBookId,
        'date' : firebase.firestore.Timestamp.now().toDate(),
        'transactionType': "Return"
    })
    db.collection('books') . doc (this.state.scannedBookId).update({
     'bookAvailability' : true,   
    })
    db.collection('students').doc (this.state.scannedStudentId).update({
        'numberOfBooksIssued' : firebase.firestore.FieldValue.increment(1)

    
    })

    this.setState({
        scannedStudentId: '',
        scannedBookId: '',
    })
}

checkBookAvailability = async () =>{ 
    const bookRef = await db.collection('books').where("bookId","==",this.state.scannedBookId).get()
var transactionType = ""
if(bookRef.docs.length === 0){
    transactionType = "false";
    console.log(bookRef.docs.length)
}
else{
    bookRef.docs.map((doc) => {
var book = doc.data()
if (book.bookAvailability)
transactionType = "Issue"
else
transactionType = "return"
    })

    return transactionType
}

}

checkStudentEligibilityForBookIssues = async () => {
    const ref = await db.collection('students').where("studentId","==",this.state.scannedStudentId).get()
    var isstudentEligible = ""
    if (ref.docs.length == 0) {
        this.setState({
            scannedStudentId: '',
            scannedBookId: '',
        })
        isstudentEligible = false

        Alert.alert(" Id doesnt exists")
    }

    else {
        ref.docs.map((doc) => {
            var student = doc.data();
            if (student.numberOfBooksIssued < 1) {
                isStudentEligible = true
            }

            else {
                isStudentEligible = false
                Alert.alert ("The person has already issued a book")
                this.setState({
                  scannedStudentId: '',
                  scannedBookId: ''
                })
            }
        })
    }
    return isStudentEligible
}

checkStudentEligibilityForReturn = async()=>{
    const transactionRef = await db.collection("transactions").where("bookId","==",this.state.scannedBookId).limit(1).get()
    var isStudentEligible = ""
    transactionRef.docs.map((doc)=>{
      var lastBookTransaction = doc.data();
      if(lastBookTransaction.studentId === this.state.scannedStudentId)
        isStudentEligible = true
      else {
        isStudentEligible = false
        Alert.alert("The book wasn't issued by this student!")
        this.setState({
          scannedStudentId: '',
          scannedBookId: ''
        })
      }
        
    })
    return isStudentEligible
  }


  handleTransaction = async()=>{
   //verify if the student is eligible for book issue or return or none
          //student id exists in the database
          //issue : number of book issued < 2
          //issue: verify book availability
          //return: last transaction -> book issued by the student id
    var transactionType = await this.checkBookEligibility();
    console.log("Transaction Type", transactionType)
    if (!transactionType) {
      Alert.alert("The book doesn't exist in the library database!")
      this.setState({
        scannedStudentId: '',
        scannedBookId: ''
      })
    }

    else if(transactionType === "Issue"){
      var isStudentEligible = await this.checkStudentEligibilityForBookIssue()
      if(isStudentEligible)
        this.initiateBookIssue()
        Alert.alert("Book issued to the student!")     
    }

    else{
      var isStudentEligible = await this.checkStudentEligibilityForReturn()
      if(isStudentEligible)
        this.initiateBookReturn()
        Alert.alert("Book returned to the library!")
    }
  }

  render() {
    const hasCameraPermissions = this.state.hasCameraPermissions;
    const scanned = this.state.scanned;
    const buttonState = this.state.buttonState;

    if (buttonState !== "normal" && hasCameraPermissions){
      return(
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      );
    }
    else if (buttonState === "normal"){
        return(
          <KeyboardAvoidingView behavior="padding" style={styles.container}>
            <View>
              <Image
                source={require("../assets/booklogo.jpg")}
                style={{width:200, height: 200}}/>
              <Text style={{textAlign: 'center', fontSize: 30}}>Bedtime Stories App</Text>
            </View>
            <View style={styles.inputView}>
            <TextInput 
              style={styles.inputBox}
              placeholder="Book Id"
              onChangeText={(text)=>{
                this.setState({
                  scannedBookId: text
                })
              }}
              value={this.state.scannedBookId}/>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions("BookId")
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
            </View>

            <View style={styles.inputView}>
            <TextInput 
              style={styles.inputBox}
              placeholder="Student Id"
              onChangeText={(text)=>{
                this.setState({
                  scannedStudentId: text
                })
              }}
              value={this.state.scannedStudentId}/>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions("UserId")
              }}>
              <Text style={styles.buttonText}>Scan it</Text>
            </TouchableOpacity>
            </View>
            <Text style={styles.transactionAlert}>{this.state.transactionMessage}</Text>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={async()=>{
                var transactionMessage = this.handleTransaction();
                console.log("Transaction Message: ",transactionMessage)
              }}>
                
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        );
      }
    }
  }


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    displayText:{
      fontSize: 20,
      textDecorationLine: 'underline'
    },
    scanButton:{
      backgroundColor: 'orange',
      padding: 20,
      margin: 20
    },
    buttonText:{
      fontSize: 20,
      textAlign: 'center',
      marginTop: 20
    },
    inputView:{
      flexDirection: 'row',
      margin: 20
    },
    inputBox:{
      width: 200,
      height: 40,
      borderWidth: 1.5,
      borderRightWidth: 0,
      fontSize: 20
    },
    scanButton:{
      backgroundColor: 'tomato',
      width: 50,
      borderWidth: 1.5,
      borderLeftWidth: 0
    },
    submitButton:{
      backgroundColor: 'orange',
      width: 100,
      height:50
    },
    submitButtonText:{
      padding: 20,
      textAlign: 'center',
      fontSize: 20,
      fontWeight:"bold",
      color: 'white'
    },
    transactionAlert:{
      margin:20,
      color: 'red'
    }
  });
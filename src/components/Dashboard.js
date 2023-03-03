import React, { Component } from "react";
import classnames from "classnames";
import axios from "axios";
import Loading from "./Loading";
import Panel from "./Panel";
import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay
 } from "helpers/selectors";
 import {setInterview} from "helpers/reducers"

const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay
  }
]

class Dashboard extends Component {
  state = {
    loading: true,
    focused: null,
    appointments: {},
    days: [],
    interviewers: {}
  }

  selectPanel(id) {
    this.setState(previousState => ({
      focused: previousState.focused !== null ? null : id
    }))
  }

  // selectPanel = id => {
  //   this.setState({
  //     focused: id
  //   })
  // }


  componentDidMount() {
    const focused = JSON.parse(localStorage.getItem("focused"));

    if (focused) {
      this.setState({ focused });
    }

    Promise.all([
      axios.get("/api/days"),
      axios.get("/api/appointments"),
      axios.get("/api/interviewers")
    ]).then(([days, appointments, interviewers]) => {
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data
        
      });
    });
    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);
    this.socket.onmessage = event => {
      const data = JSON.parse(event.data);
    
      if (typeof data === "object" && data.type === "SET_INTERVIEW") {
        this.setState(previousState =>
          setInterview(previousState, data.id, data.interview)
        );
      }
    };
  }

  componentWillUnmount() {
    this.socket.close();
  }
  

  componentDidUpdate(previousProps, previousState) {
    if (previousState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }
  
  render() {

    const parsedData = (this.state.focused ? data.filter(element => this.state.focused === element.id) : data).map(element => (
      <Panel key={element.id} 
      id={element.id} 
      label={element.getValue(this.state)}
      value={element.value} 
      onSelect={event => this.selectPanel(element.id)}/>
    ))

    const dashboardClasses = classnames("dashboard", {"dashboard--focused": this.state.focused});

    if (this.state.loading) {
     return <Loading/>;
    }

    return <main className={dashboardClasses}>{parsedData}</main>
  }
}

export default Dashboard;

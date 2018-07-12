import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import reactLogo from '../../images/react-logo.svg';
import rekitLogo from '../../images/rekit-logo.svg';
import * as actions from './redux/actions';
import image1 from '../../images/jfk.jpg';

export class DefaultPage extends Component {
  static propTypes = {
    home: PropTypes.object.isRequired,
    actions: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props)
    this.state = {
       
    }
  }
  


  

  componentWillMount(element, image) {

    this.element = element;
		this.image = image;
		this.width = 570;
		this.height = 810; // replace with real dimensions!
		this.offset_x = 0;
		this.offset_y = 0;
		this.rotation = 0;
		this.zoom = 0;
		this.zoom_real = 1;

		this.points = Array();
		this.lines = Array();

		// element.style.backgroundImage = "url(" + image + ")";
		// element.style.width = this.width + "px";
		// element.style.height = this.height + "px";
		// element.style.position = "relative";
		// document.addEventListener("dblclick", this.create_point);
		// document.addEventListener("mousedown", this.drag_point);
    // document.addEventListener("wheel", event => this.change_zoom(event));
    


		document.addEventListener("keydown", event => this.dolly(event));
    //var editor_element = document.getElementById("polygon");
    this.pylogon = React.createRef()
    window.polygon_editor = new DefaultPage(this.pylogon, image1);
  }


  
	// create_point(event) {
	// 	// find closest point...
	// 	// if it's really close, delete, return!
	// 	// find closest edge
	// 	// create point on edge, engage drag_point, return!
	// 	console.log("Create point");
  // }
  
	// drag_point(event) {
	// 	// set document's mouseup event to the exit condition
	// 	// of a loop that moves the point to the cursor and
	// 	// re-renders it!
	// 	// unset the mouseup event, return!
	// 	console.log("Drag point");
	// }

	// update_offset() {
	// 	this.element.style.left = this.offset_x + "px";
	// 	this.element.style.top = this.offset_y + "px";
  // }
  

	// update_filters() {
	// 	this.element.style.filter =
	// 		"rotate(" + this.rotation + "deg)"
	// 	this.element.style.transform =
	// 		"scale(" + this.zoom_real + "," + this.zoom_real + ")";
	// }


	// change_zoom(event) {
	// 	this.zoom -= event.deltaY / 10;
	// 	console.log(this.zoom);
	// 	var real_delta = 2 ** this.zoom - this.zoom_real;
	// 	this.offset_x -= (event.offsetX - this.element.offsetWidth / 2) * real_delta;
	// 	this.offset_y -= (event.offsetY - this.element.offsetHeight / 2) * real_delta;
	// 	this.zoom_real = 2 ** this.zoom;
	// 	this.update_offset();
	// 	this.update_filters();
  // }
  


	// dolly(event) {
	// 	event = event || window.event;

	// 	if (event.key == "ArrowUp") {
	// 		this.offset_y += 16.5 + this.zoom_real;
	// 	}
	// 	else if (event.key == "ArrowDown") {
	// 		this.offset_y -= 16.5 + this.zoom_real;
	// 	}
	// 	else if (event.key == "ArrowLeft") {
	// 		this.offset_x += 16.5 + this.zoom_real;
	// 	}
	// 	else if (event.key == "ArrowRight") {
	// 		this.offset_x -= 16.5 + this.zoom_real;
	// 	}
	// 	this.update_offset();
  // }



  render() {
    return (
      <div className="home-default-page">
        <header className="app-header">
          <img src={reactLogo} className="app-logo" alt="logo" />
          <img src={rekitLogo} className="rekit-logo" alt="logo" />
          <h1 className="app-title">Welcome to React</h1>
        </header>

        <div className="app-intro">
          <div className="mt-2">
              <div className="container mt-5" >
                  
                  <div ref={this.pylogon} >
                  <div id="working-area">
                    <div id="preview-img-wrap"  ondragover="return false;" >
                    <img id="preview-img"  src={image1} alt="hello images"/>
                    <span id="clip-circle"></span>
                  </div>
                </div>
                </div>


              </div>
          </div>
      
        </div>

      </div>
    );
  }
}

/* istanbul ignore next */
function mapStateToProps(state) {
  return {
    home: state.home,
  };
}

/* istanbul ignore next */
function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({ ...actions }, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DefaultPage);
